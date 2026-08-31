const { query } = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM categories ORDER BY name ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi.' });
    const result = await query(
      'INSERT INTO categories (name, description, icon) VALUES ($1,$2,$3) RETURNING *',
      [name, description || null, icon || 'Folder']
    );
    res.status(201).json({ success: true, message: 'Kategori berhasil ditambahkan.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    const result = await query(
      'UPDATE categories SET name=$1, description=$2, icon=$3 WHERE id=$4 RETURNING *',
      [name, description || null, icon || 'Folder', req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });
    res.json({ success: true, message: 'Kategori berhasil diperbarui.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM categories WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });
    res.json({ success: true, message: 'Kategori berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, update, remove };
