const { query } = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const { search = '', category_id } = req.query;
    let sql = `
      SELECT p.*, c.name as category_name, c.icon as category_icon
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`;
    }
    if (category_id) {
      params.push(category_id);
      sql += ` AND p.category_id = $${params.length}`;
    }
    sql += ' ORDER BY p.created_at DESC';

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { category_id, name, sku, price, cost_price, stock, min_stock, unit, image_url, description } = req.body;
    if (!name || !price) return res.status(400).json({ success: false, message: 'Nama dan harga produk wajib diisi.' });

    const result = await query(
      `INSERT INTO products (category_id, name, sku, price, cost_price, stock, min_stock, unit, image_url, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [category_id || null, name, sku || null, price, cost_price || 0, stock || 0, min_stock || 5, unit || 'pcs', image_url || null, description || null]
    );
    res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { category_id, name, sku, price, cost_price, stock, min_stock, unit, image_url, description } = req.body;
    const result = await query(
      `UPDATE products SET category_id=$1, name=$2, sku=$3, price=$4, cost_price=$5, stock=$6,
       min_stock=$7, unit=$8, image_url=$9, description=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [category_id || null, name, sku || null, price, cost_price || 0, stock || 0, min_stock || 5, unit || 'pcs', image_url || null, description || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    res.json({ success: true, message: 'Produk berhasil diperbarui.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM products WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    res.json({ success: true, message: 'Produk berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
