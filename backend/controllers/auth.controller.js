const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const config = require('../config/env');

const {
  validateEmail,
  validatePassword,
} = require('../utils/validation');

const login = async (req, res, next) => {
  try {
    const body = req.body || {};
    const { email, password } = body;

    let error = validateEmail(email);
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

    const cleanEmail = email.trim().toLowerCase();

    const userRes = await query(
      `SELECT id, name, email, password, role, phone
       FROM users
       WHERE email = $1`,
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    if (!['owner', 'cashier'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akun pengguna tidak memiliki role yang valid.',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      config.jwtSecret,
      {
        expiresIn: config.jwtExpiresIn,
        algorithm: 'HS256',
      }
    );

    delete user.password;

    res.json({
      success: true,
      message: 'Login berhasil!',
      data: {
        user,
        token,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const userRes = await query(
      `SELECT id, name, email, role, phone, created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data pengguna tidak ditemukan.',
      });
    }

    if (!['owner', 'cashier'].includes(userRes.rows[0].role)) {
      return res.status(403).json({
        success: false,
        message: 'Role pengguna tidak valid.',
      });
    }

    res.json({
      success: true,
      data: userRes.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  getMe,
};
