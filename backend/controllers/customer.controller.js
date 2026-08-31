const { query } = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const { search = '' } = req.query;
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1)`;
    }
    sql += ' ORDER BY total_spent DESC';
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const custRes = await query('SELECT * FROM customers WHERE id=$1', [req.params.id]);
    if (!custRes.rows.length) return res.status(404).json({ success: false, message: 'Pelanggan tidak ditemukan.' });

    const txRes = await query(
      `SELECT t.id, t.invoice_no, t.final_amount, t.payment_method, t.created_at
       FROM transactions t WHERE t.customer_id=$1 ORDER BY t.created_at DESC LIMIT 10`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...custRes.rows[0], recent_transactions: txRes.rows } });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nama pelanggan wajib diisi.' });
    const result = await query(
      'INSERT INTO customers (name, email, phone, address) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, email || null, phone || null, address || null]
    );
    res.status(201).json({ success: true, message: 'Pelanggan berhasil ditambahkan.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;
    const result = await query(
      'UPDATE customers SET name=$1, email=$2, phone=$3, address=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
      [name, email || null, phone || null, address || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Pelanggan tidak ditemukan.' });
    res.json({ success: true, message: 'Data pelanggan berhasil diperbarui.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM customers WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Pelanggan tidak ditemukan.' });
    res.json({ success: true, message: 'Pelanggan berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
