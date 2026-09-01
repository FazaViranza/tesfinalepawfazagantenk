const { query, getClient } = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status,
      payment_method,
    } = req.query;

    const userId = req.user.id;
    const userRole = req.user.role;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const params = [];
    let whereClause = 'WHERE 1=1';

    // Cashier hanya boleh melihat transaksi miliknya sendiri.
    // Owner boleh melihat seluruh transaksi.
    if (userRole === 'cashier') {
      params.push(userId);
      whereClause += ` AND t.user_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND t.invoice_no ILIKE $${params.length}`;
    }

    if (status) {
      params.push(status);
      whereClause += ` AND t.status = $${params.length}`;
    }

    if (payment_method) {
      params.push(payment_method);
      whereClause += ` AND t.payment_method = $${params.length}`;
    }

    // Count transaksi
    const countRes = await query(
      `
      SELECT COUNT(*)
      FROM transactions t
      ${whereClause}
      `,
      params
    );

    const total = parseInt(countRes.rows[0].count, 10);

    // Ambil transaksi
    const dataParams = [...params, limitNumber, offset];

    const txRes = await query(
      `
      SELECT
        t.*,
        u.name AS cashier_name
      FROM transactions t
      LEFT JOIN users u
        ON t.user_id = u.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${dataParams.length - 1}
      OFFSET $${dataParams.length}
      `,
      dataParams
    );

    res.json({
      success: true,
      data: txRes.rows,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const params = [req.params.id];

    let ownershipClause = '';

    // Cashier hanya boleh membuka transaksi miliknya sendiri.
    if (userRole === 'cashier') {
      params.push(userId);
      ownershipClause = `AND t.user_id = $${params.length}`;
    }

    const txRes = await query(
      `
      SELECT
        t.*,
        u.name AS cashier_name
      FROM transactions t
      LEFT JOIN users u
        ON t.user_id = u.id
      WHERE t.id = $1
      ${ownershipClause}
      `,
      params
    );

    if (!txRes.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan.',
      });
    }

    const detailsRes = await query(
      `
      SELECT
        td.*,
        p.image_url
      FROM transaction_details td
      LEFT JOIN products p
        ON td.product_id = p.id
      WHERE td.transaction_id = $1
      ORDER BY td.id ASC
      `,
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...txRes.rows[0],
        items: detailsRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const {
      items,
      discount_amount = 0,
      payment_method = 'cash',
      paid_amount,
      notes,
    } = req.body;

    // User otomatis diambil dari JWT.
    const userId = req.user.id;

    // ==========================================
    // VALIDASI CART
    // ==========================================

    if (!Array.isArray(items) || items.length === 0) {
      await client.query('ROLLBACK');
      client.release();

      return res.status(400).json({
        success: false,
        message: 'Keranjang belanja kosong.',
      });
    }

    // ==========================================
    // VALIDASI PAYMENT METHOD
    // ==========================================

    const allowedPaymentMethods = [
      'cash',
      'qris',
      'transfer',
      'debit',
    ];

    if (!allowedPaymentMethods.includes(payment_method)) {
      await client.query('ROLLBACK');
      client.release();

      return res.status(400).json({
        success: false,
        message: 'Metode pembayaran tidak valid.',
      });
    }

    // ==========================================
    // VALIDASI PRODUK & HITUNG TOTAL
    // ==========================================

    let totalAmount = 0;
    const itemsData = [];

    for (const item of items) {
      const productId = parseInt(item.product_id, 10);
      const quantity = parseInt(item.quantity, 10);

      if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) {
        await client.query('ROLLBACK');
        client.release();

        return res.status(400).json({
          success: false,
          message: 'Data produk atau quantity tidak valid.',
        });
      }

      const prodRes = await client.query(
        `
        SELECT *
        FROM products
        WHERE id = $1
        FOR UPDATE
        `,
        [productId]
      );

      if (!prodRes.rows.length) {
        await client.query('ROLLBACK');
        client.release();

        return res.status(400).json({
          success: false,
          message: `Produk ID ${productId} tidak ditemukan.`,
        });
      }

      const product = prodRes.rows[0];

      if (product.stock < quantity) {
        await client.query('ROLLBACK');
        client.release();

        return res.status(400).json({
          success: false,
          message:
            `Stok ${product.name} tidak mencukupi ` +
            `(sisa: ${product.stock}).`,
        });
      }

      const unitPrice = parseFloat(product.price);
      const costPrice = parseFloat(product.cost_price);
      const subtotal = unitPrice * quantity;

      totalAmount += subtotal;

      itemsData.push({
        productId,
        quantity,
        product,
        unitPrice,
        costPrice,
        subtotal,
      });
    }

    // ==========================================
    // DISCOUNT
    // ==========================================

    const discount = parseFloat(discount_amount) || 0;

    if (
      Number.isNaN(discount) ||
      discount < 0 ||
      discount > totalAmount
    ) {
      await client.query('ROLLBACK');
      client.release();

      return res.status(400).json({
        success: false,
        message: 'Nominal diskon tidak valid.',
      });
    }

    const finalAmount = totalAmount - discount;

    // ==========================================
    // PAYMENT
    // ==========================================

    const paid =
      paid_amount === undefined ||
      paid_amount === null ||
      paid_amount === ''
        ? finalAmount
        : parseFloat(paid_amount);

    if (
      Number.isNaN(paid) ||
      paid < finalAmount
    ) {
      await client.query('ROLLBACK');
      client.release();

      return res.status(400).json({
        success: false,
        message: 'Nominal pembayaran tidak mencukupi.',
      });
    }

    const change = paid - finalAmount;

    // ==========================================
    // GENERATE INVOICE
    // ==========================================

    const now = new Date();

    const dateStr =
      `${now.getFullYear()}` +
      `${String(now.getMonth() + 1).padStart(2, '0')}` +
      `${String(now.getDate()).padStart(2, '0')}`;

    const countRes = await client.query(
      `
      SELECT COUNT(*)
      FROM transactions
      WHERE DATE(created_at) = CURRENT_DATE
      `
    );

    const seqNum =
      String(
        parseInt(countRes.rows[0].count, 10) + 1
      ).padStart(4, '0');

    const invoiceNo =
      `INV-${dateStr}-${seqNum}`;

    // ==========================================
    // INSERT TRANSACTION
    // ==========================================

    const txRes = await client.query(
      `
      INSERT INTO transactions (
        invoice_no,
        user_id,
        total_amount,
        discount_amount,
        tax_amount,
        final_amount,
        paid_amount,
        change_amount,
        payment_method,
        status,
        notes
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11
      )
      RETURNING *
      `,
      [
        invoiceNo,
        userId,
        totalAmount,
        discount,
        0,
        finalAmount,
        paid,
        change,
        payment_method,
        'completed',
        notes || null,
      ]
    );

    const newTx = txRes.rows[0];

    // ==========================================
    // INSERT DETAILS + UPDATE STOCK
    // ==========================================

    for (const item of itemsData) {
      await client.query(
        `
        INSERT INTO transaction_details (
          transaction_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          cost_price,
          subtotal
        )
        VALUES (
          $1, $2, $3, $4,
          $5, $6, $7
        )
        `,
        [
          newTx.id,
          item.productId,
          item.product.name,
          item.quantity,
          item.unitPrice,
          item.costPrice,
          item.subtotal,
        ]
      );

      await client.query(
        `
        UPDATE products
        SET
          stock = stock - $1,
          updated_at = NOW()
        WHERE id = $2
        `,
        [
          item.quantity,
          item.productId,
        ]
      );
    }

    await client.query('COMMIT');
    client.release();

    // ==========================================
    // FETCH COMPLETE TRANSACTION
    // ==========================================

    const fullTx = await query(
      `
      SELECT
        t.*,
        u.name AS cashier_name
      FROM transactions t
      LEFT JOIN users u
        ON t.user_id = u.id
      WHERE t.id = $1
      `,
      [newTx.id]
    );

    const details = await query(
      `
      SELECT
        td.*,
        p.image_url
      FROM transaction_details td
      LEFT JOIN products p
        ON td.product_id = p.id
      WHERE td.transaction_id = $1
      ORDER BY td.id ASC
      `,
      [newTx.id]
    );

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil diproses!',
      data: {
        ...fullTx.rows[0],
        items: details.rows,
      },
    });

  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // Ignore rollback error
    }

    client.release();
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  create,
};