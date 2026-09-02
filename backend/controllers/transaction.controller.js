const { query, getClient } = require('../config/db');

const MAX_PAGE_SIZE = 100;

const allowedPaymentMethods = [
  'cash',
  'qris',
  'transfer',
  'debit',
];

const parseStrictInteger = (value) => {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) ? value : null;
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) {
    return null;
  }

  const number = Number(value.trim());

  return Number.isSafeInteger(number) ? number : null;
};

const parseStrictNumber = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  if (!/^\d+(\.\d+)?$/.test(value.trim())) {
    return null;
  }

  const number = Number(value.trim());

  return Number.isFinite(number) ? number : null;
};

const validateTextLength = (value, maxLength) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return 'Format teks tidak valid.';
  }

  const text = value.trim();

  if (text.length > maxLength) {
    return `Teks maksimal ${maxLength} karakter.`;
  }

  return null;
};

const getAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status,
      payment_method,
    } = req.query;

    const pageNumber = parseStrictInteger(page);
    const limitNumber = parseStrictInteger(limit);

    if (
      pageNumber === null ||
      pageNumber < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nomor halaman tidak valid.',
      });
    }

    if (
      limitNumber === null ||
      limitNumber < 1 ||
      limitNumber > MAX_PAGE_SIZE
    ) {
      return res.status(400).json({
        success: false,
        message: `Limit harus antara 1-${MAX_PAGE_SIZE}.`,
      });
    }

    if (typeof search !== 'string' || search.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Parameter pencarian tidak valid.',
      });
    }

    if (
      status !== undefined &&
      status !== 'completed'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Status transaksi tidak valid.',
      });
    }

    if (
      payment_method !== undefined &&
      !allowedPaymentMethods.includes(payment_method)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Metode pembayaran tidak valid.',
      });
    }

    const offset = (pageNumber - 1) * limitNumber;

    const params = [];
    let whereClause = 'WHERE 1=1';

    const userId = req.user.id;
    const userRole = req.user.role;

    // Cashier hanya boleh melihat transaksinya sendiri.
    if (userRole === 'cashier') {
      params.push(userId);
      whereClause += ` AND t.user_id = $${params.length}`;
    }

    if (search.trim()) {
      params.push(`%${search.trim()}%`);
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

    const countRes = await query(
      `
      SELECT COUNT(*)
      FROM transactions t
      ${whereClause}
      `,
      params
    );

    const total = Number(countRes.rows[0].count);

    const dataParams = [
      ...params,
      limitNumber,
      offset,
    ];

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
        totalPages: Math.ceil(
          total / limitNumber
        ),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const transactionId = parseStrictInteger(
      req.params.id
    );

    if (transactionId === null || transactionId < 1) {
      return res.status(400).json({
        success: false,
        message: 'ID transaksi tidak valid.',
      });
    }

    const userId = req.user.id;
    const userRole = req.user.role;

    const params = [transactionId];

    let ownershipClause = '';

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
      [transactionId]
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

    const userId = req.user.id;

    // ==========================================
    // VALIDASI NOTES
    // ==========================================

    const notesError = validateTextLength(
      notes,
      500
    );

    if (notesError) {
      await client.query('ROLLBACK');
      client.release();

      return res.status(400).json({
        success: false,
        message: notesError,
      });
    }

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

    if (items.length > 100) {
      await client.query('ROLLBACK');
      client.release();

      return res.status(400).json({
        success: false,
        message: 'Jumlah item transaksi terlalu banyak.',
      });
    }

    // ==========================================
    // NORMALISASI CART
    // ==========================================

    const itemMap = new Map();

    for (const item of items) {
      if (
        !item ||
        typeof item !== 'object'
      ) {
        await client.query('ROLLBACK');
        client.release();

        return res.status(400).json({
          success: false,
          message: 'Format item transaksi tidak valid.',
        });
      }

      const productId = parseStrictInteger(
        item.product_id
      );

      const quantity = parseStrictInteger(
        item.quantity
      );

      if (
        productId === null ||
        productId < 1 ||
        quantity === null ||
        quantity < 1
      ) {
        await client.query('ROLLBACK');
        client.release();

        return res.status(400).json({
          success: false,
          message: 'Data produk atau quantity tidak valid.',
        });
      }

      const currentQuantity =
        itemMap.get(productId) || 0;

      const combinedQuantity =
        currentQuantity + quantity;

      if (combinedQuantity > 100000) {
        await client.query('ROLLBACK');
        client.release();

        return res.status(400).json({
          success: false,
          message: 'Quantity produk terlalu besar.',
        });
      }

      itemMap.set(
        productId,
        combinedQuantity
      );
    }

    // ==========================================
    // VALIDASI PAYMENT METHOD
    // ==========================================

    if (
      !allowedPaymentMethods.includes(
        payment_method
      )
    ) {
      await client.query('ROLLBACK');
      client.release();

      return res.status(400).json({
        success: false,
        message: 'Metode pembayaran tidak valid.',
      });
    }

    // ==========================================
    // LOCK PRODUCTS + HITUNG TOTAL
    // ==========================================

    let totalAmount = 0;
    const itemsData = [];

    for (const [
      productId,
      quantity,
    ] of itemMap.entries()) {

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

      const stock = parseStrictInteger(
        product.stock
      );

      const unitPrice = parseStrictNumber(
        product.price
      );

      const costPrice = parseStrictNumber(
        product.cost_price
      );

      if (
        stock === null ||
        unitPrice === null ||
        costPrice === null
      ) {
        await client.query('ROLLBACK');
        client.release();

        return res.status(500).json({
          success: false,
          message: 'Data produk di database tidak valid.',
        });
      }

      if (stock < quantity) {
        await client.query('ROLLBACK');
        client.release();

        return res.status(400).json({
          success: false,
          message:
            `Stok ${product.name} tidak mencukupi ` +
            `(sisa: ${stock}).`,
        });
      }

      const subtotal =
        unitPrice * quantity;

      if (!Number.isFinite(subtotal)) {
        await client.query('ROLLBACK');
        client.release();

        return res.status(400).json({
          success: false,
          message: 'Nilai transaksi tidak valid.',
        });
      }

      totalAmount += subtotal;

      if (!Number.isFinite(totalAmount)) {
        await client.query('ROLLBACK');
        client.release();

        return res.status(400).json({
          success: false,
          message: 'Total transaksi terlalu besar.',
        });
      }

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

    const discount =
      parseStrictNumber(discount_amount);

    if (
      discount === null ||
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

    const finalAmount =
      totalAmount - discount;

    // ==========================================
    // PAYMENT
    // ==========================================

    let paid;

    if (
      payment_method !== 'cash' &&
      (
        paid_amount === undefined ||
        paid_amount === null ||
        paid_amount === ''
      )
    ) {
      paid = finalAmount;
    } else {
      paid = parseStrictNumber(
        paid_amount
      );
    }

    if (
      paid === null ||
      paid < finalAmount
    ) {
      await client.query('ROLLBACK');
      client.release();

      return res.status(400).json({
        success: false,
        message: 'Nominal pembayaran tidak mencukupi.',
      });
    }

    const change =
      paid - finalAmount;

    // ==========================================
    // INVOICE LOCK
    // ==========================================
    // Mengunci pembuatan nomor invoice
    // dalam transaksi agar request bersamaan
    // tidak mengambil sequence yang sama.

    await client.query(
      `
      SELECT pg_advisory_xact_lock(
        hashtext(
          'umkm_ai_invoice_' ||
          CURRENT_DATE::text
        )
      )
      `
    );

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

    const seqNum = String(
      Number(countRes.rows[0].count) + 1
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
        notes
          ? notes.trim()
          : null,
      ]
    );

    const newTx =
      txRes.rows[0];

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