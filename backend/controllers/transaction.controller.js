const { query, getClient } = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status, payment_method } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (t.invoice_no ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
    }
    if (status) {
      params.push(status);
      whereClause += ` AND t.status = $${params.length}`;
    }
    if (payment_method) {
      params.push(payment_method);
      whereClause += ` AND t.payment_method = $${params.length}`;
    }

    const countRes = await query(
      `SELECT COUNT(*) FROM transactions t LEFT JOIN customers c ON t.customer_id = c.id ${whereClause}`,
      params
    );

    params.push(parseInt(limit), offset);
    const txRes = await query(
      `SELECT t.*, c.name as customer_name, u.name as cashier_name
       FROM transactions t
       LEFT JOIN customers c ON t.customer_id = c.id
       LEFT JOIN users u ON t.user_id = u.id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      success: true,
      data: txRes.rows,
      meta: {
        total: parseInt(countRes.rows[0].count, 10),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const txRes = await query(
      `SELECT t.*, c.name as customer_name, c.phone as customer_phone, u.name as cashier_name
       FROM transactions t
       LEFT JOIN customers c ON t.customer_id = c.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (!txRes.rows.length) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });

    const detailsRes = await query(
      `SELECT td.*, p.image_url FROM transaction_details td
       LEFT JOIN products p ON td.product_id = p.id
       WHERE td.transaction_id = $1`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...txRes.rows[0], items: detailsRes.rows } });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { customer_id, items, discount_amount = 0, payment_method = 'cash', paid_amount, notes } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ success: false, message: 'Keranjang belanja kosong.' });
    }

    // Validate and collect product data
    let totalAmount = 0;
    const itemsData = [];
    for (const item of items) {
      const prodRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
      if (!prodRes.rows.length) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ success: false, message: `Produk ID ${item.product_id} tidak ditemukan.` });
      }
      const prod = prodRes.rows[0];
      if (prod.stock < item.quantity) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ success: false, message: `Stok ${prod.name} tidak mencukupi (sisa: ${prod.stock}).` });
      }
      const subtotal = parseFloat(prod.price) * item.quantity;
      totalAmount += subtotal;
      itemsData.push({ ...item, product: prod, unit_price: parseFloat(prod.price), cost_price: parseFloat(prod.cost_price), subtotal });
    }

    const disc = parseFloat(discount_amount) || 0;

    if (disc < 0 || disc > totalAmount) {
      await client.query('ROLLBACK');
      client.release();

      return res.status(400).json({
        success: false,
        message: 'Nominal diskon tidak valid.',
      });
    }

    const finalAmount = totalAmount - disc;

    const paid =
      paid_amount === undefined || paid_amount === null
        ? finalAmount
        : parseFloat(paid_amount);

    if (Number.isNaN(paid) || paid < finalAmount) {
      await client.query('ROLLBACK');
      client.release();

      return res.status(400).json({
        success: false,
        message: 'Nominal pembayaran tidak mencukupi.',
      });
    }

    const change = paid - finalAmount;

    // Generate invoice number
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const countRes = await client.query(`SELECT COUNT(*) FROM transactions WHERE DATE(created_at) = CURRENT_DATE`);
    const seqNum = String(parseInt(countRes.rows[0].count, 10) + 1).padStart(4, '0');
    const invoiceNo = `INV-${dateStr}-${seqNum}`;

    // Insert transaction
    const txRes = await client.query(
      `INSERT INTO transactions (invoice_no, user_id, customer_id, total_amount, discount_amount, final_amount, paid_amount, change_amount, payment_method, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [invoiceNo, userId, customer_id || null, totalAmount, disc, finalAmount, paid, change, payment_method, notes || null]
    );
    const newTx = txRes.rows[0];

    // Insert items & deduct stock
    for (const item of itemsData) {
      await client.query(
        `INSERT INTO transaction_details (transaction_id, product_id, product_name, quantity, unit_price, cost_price, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [newTx.id, item.product_id, item.product.name, item.quantity, item.unit_price, item.cost_price, item.subtotal]
      );
      await client.query('UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2', [item.quantity, item.product_id]);
    }

    // Update customer stats
    if (customer_id) {
      const tier = finalAmount >= 500000 ? 'Platinum' : finalAmount >= 200000 ? 'Gold' : finalAmount >= 100000 ? 'Silver' : 'Regular';
      await client.query(
        `UPDATE customers SET total_spent = total_spent + $1, total_orders = total_orders + 1,
         member_tier = CASE WHEN total_spent + $1 >= 500000 THEN 'Platinum' WHEN total_spent + $1 >= 200000 THEN 'Gold' WHEN total_spent + $1 >= 100000 THEN 'Silver' ELSE member_tier END,
         updated_at = NOW() WHERE id = $2`,
        [finalAmount, customer_id]
      );
    }

    await client.query('COMMIT');
    client.release();

    // Fetch complete transaction with details for receipt
    const fullTx = await query(
      `SELECT t.*, c.name as customer_name, u.name as cashier_name FROM transactions t
       LEFT JOIN customers c ON t.customer_id = c.id
       LEFT JOIN users u ON t.user_id = u.id WHERE t.id = $1`,
      [newTx.id]
    );
    const details = await query(
      'SELECT td.*, p.image_url FROM transaction_details td LEFT JOIN products p ON td.product_id = p.id WHERE td.transaction_id = $1',
      [newTx.id]
    );

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil diproses!',
      data: { ...fullTx.rows[0], items: details.rows },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    next(err);
  }
};

module.exports = { getAll, getById, create };
