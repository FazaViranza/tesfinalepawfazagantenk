const { query } = require('../config/db');

const {
  validateText,
  validatePrice,
  validateInteger,
  validateUrl,
} = require('../utils/validation');

const validateProduct = (body) => {
  const {
    name,
    price,
    cost_price,
    stock,
    min_stock,
    unit,
    sku,
    image_url,
    description,
  } = body;

  let error;

  error = validateText(name, 'Nama produk', 150);
  if (error) return error;

  error = validatePrice(price, 'Harga jual');
  if (error) return error;

  if (cost_price !== undefined && cost_price !== null && cost_price !== '') {
    error = validatePrice(cost_price, 'Harga modal / HPP');
    if (error) return error;
  }

  if (stock !== undefined && stock !== null && stock !== '') {
    error = validateInteger(stock, 'Stok');
    if (error) return error;
  }

  if (min_stock !== undefined && min_stock !== null && min_stock !== '') {
    error = validateInteger(min_stock, 'Minimum stok');
    if (error) return error;
  }

  error = validateText(unit || 'pcs', 'Satuan', 30);
  if (error) return error;

  if (sku !== undefined && sku !== null && sku !== '') {
    if (String(sku).trim().length > 50) {
      return 'SKU maksimal 50 karakter.';
    }
  }

  if (image_url) {
    error = validateUrl(image_url);
    if (error) return error;
  }

  if (description && String(description).trim().length > 1000) {
    return 'Deskripsi maksimal 1000 karakter.';
  }

  return null;
};

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

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const validationError = validateProduct(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const {
      category_id,
      name,
      sku,
      price,
      cost_price,
      stock,
      min_stock,
      unit,
      image_url,
      description,
    } = req.body;

    const result = await query(
      `INSERT INTO products
        (category_id, name, sku, price, cost_price, stock, min_stock, unit, image_url, description)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        category_id || null,
        name.trim(),
        sku ? sku.trim() : null,
        Number(price),
        cost_price === '' || cost_price == null ? 0 : Number(cost_price),
        stock === '' || stock == null ? 0 : Number(stock),
        min_stock === '' || min_stock == null ? 5 : Number(min_stock),
        unit ? unit.trim() : 'pcs',
        image_url ? image_url.trim() : null,
        description ? description.trim() : null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan.',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const validationError = validateProduct(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const {
      category_id,
      name,
      sku,
      price,
      cost_price,
      stock,
      min_stock,
      unit,
      image_url,
      description,
    } = req.body;

    const result = await query(
      `UPDATE products
       SET category_id=$1,
           name=$2,
           sku=$3,
           price=$4,
           cost_price=$5,
           stock=$6,
           min_stock=$7,
           unit=$8,
           image_url=$9,
           description=$10,
           updated_at=NOW()
       WHERE id=$11
       RETURNING *`,
      [
        category_id || null,
        name.trim(),
        sku ? sku.trim() : null,
        Number(price),
        cost_price === '' || cost_price == null ? 0 : Number(cost_price),
        stock === '' || stock == null ? 0 : Number(stock),
        min_stock === '' || min_stock == null ? 5 : Number(min_stock),
        unit ? unit.trim() : 'pcs',
        image_url ? image_url.trim() : null,
        description ? description.trim() : null,
        req.params.id,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      message: 'Produk berhasil diperbarui.',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM products WHERE id=$1 RETURNING id',
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      message: 'Produk berhasil dihapus.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};