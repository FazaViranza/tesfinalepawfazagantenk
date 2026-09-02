const bcrypt = require('bcryptjs');

const { query } = require('../config/db');

const {
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
} = require('../utils/validation');

// ===============================
// GET ALL CASHIERS
// ===============================

const getAllCashiers = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, email, phone, role, created_at
       FROM users
       WHERE role = 'cashier'
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// ===============================
// GET CASHIER BY ID
// ===============================

const getCashierById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, name, email, phone, role, created_at
       FROM users
       WHERE id = $1
         AND role = 'cashier'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Akun kasir tidak ditemukan.',
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

// ===============================
// CREATE CASHIER
// ===============================

const createCashier = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
    } = req.body;

    // ===============================
    // VALIDATION
    // ===============================

    let error;

    error = validateName(name);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    error = validateEmail(email);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    error = validatePhone(phone);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    error = validatePassword(password, true);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // ===============================
    // CHECK DUPLICATE EMAIL
    // ===============================

    const existing = await query(
      `SELECT id
       FROM users
       WHERE email = $1`,
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah digunakan.',
      });
    }

    // ===============================
    // HASH PASSWORD
    // ===============================

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // ===============================
    // INSERT CASHIER
    // ===============================
    // Role selalu cashier.
    // Tidak mengambil role dari client.

    const result = await query(
      `INSERT INTO users
        (name, email, password, role, phone)
       VALUES
        ($1, $2, $3, 'cashier', $4)
       RETURNING id, name, email, role, phone, created_at`,
      [
        cleanName,
        cleanEmail,
        hashedPassword,
        cleanPhone,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Akun kasir berhasil dibuat.',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// ===============================
// UPDATE CASHIER
// ===============================

const updateCashier = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      password,
      phone,
    } = req.body;

    // ===============================
    // VALIDATION
    // ===============================

    let error;

    error = validateName(name);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    error = validateEmail(email);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    error = validatePhone(phone);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    // Password optional saat update.
    // Kalau diisi, minimal 6 karakter.

    if (
      password !== undefined &&
      password !== null &&
      password !== ''
    ) {
      error = validatePassword(
        password,
        false
      );

      if (error) {
        return res.status(400).json({
          success: false,
          message: error,
        });
      }
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // ===============================
    // CHECK CASHIER EXISTS
    // ===============================

    const existingUser = await query(
      `SELECT id
       FROM users
       WHERE id = $1
         AND role = 'cashier'`,
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Akun kasir tidak ditemukan.',
      });
    }

    // ===============================
    // CHECK DUPLICATE EMAIL
    // ===============================

    const duplicateEmail = await query(
      `SELECT id
       FROM users
       WHERE email = $1
         AND id != $2`,
      [
        cleanEmail,
        id,
      ]
    );

    if (duplicateEmail.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Email sudah digunakan oleh pengguna lain.',
      });
    }

    // ===============================
    // UPDATE
    // ===============================

    let result;

    if (
      password !== undefined &&
      password !== null &&
      password !== ''
    ) {
      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      result = await query(
        `UPDATE users
         SET name = $1,
             email = $2,
             phone = $3,
             password = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
           AND role = 'cashier'
         RETURNING id, name, email, role, phone, created_at`,
        [
          cleanName,
          cleanEmail,
          cleanPhone,
          hashedPassword,
          id,
        ]
      );
    } else {
      result = await query(
        `UPDATE users
         SET name = $1,
             email = $2,
             phone = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
           AND role = 'cashier'
         RETURNING id, name, email, role, phone, created_at`,
        [
          cleanName,
          cleanEmail,
          cleanPhone,
          id,
        ]
      );
    }

    res.json({
      success: true,
      message: 'Akun kasir berhasil diperbarui.',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// ===============================
// DELETE CASHIER
// ===============================

const deleteCashier = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await query(
      `SELECT id, name
       FROM users
       WHERE id = $1
         AND role = 'cashier'`,
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Akun kasir tidak ditemukan.',
      });
    }

    await query(
      `DELETE FROM users
       WHERE id = $1
         AND role = 'cashier'`,
      [id]
    );

    res.json({
      success: true,
      message:
        `Akun kasir "${existingUser.rows[0].name}" berhasil dihapus.`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllCashiers,
  getCashierById,
  createCashier,
  updateCashier,
  deleteCashier,
};