const jwt = require('jsonwebtoken');
const config = require('../config/env');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token autentikasi tidak ditemukan.',
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token autentikasi tidak ditemukan.',
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
    });

    if (!decoded || !Number.isSafeInteger(Number(decoded.id)) || Number(decoded.id) < 1) {
      return res.status(401).json({
        success: false,
        message: 'Sesi login tidak valid.',
      });
    }

    if (!['owner', 'cashier'].includes(decoded.role)) {
      return res.status(401).json({
        success: false,
        message: 'Sesi login tidak valid.',
      });
    }

    req.user = {
      id: Number(decoded.id),
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Sesi login telah berakhir atau token tidak valid.',
    });
  }
};

const authorize = (roles = []) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Akses tidak diizinkan. Silakan login terlebih dahulu.',
      });
    }

    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Hak akses tidak mencukupi untuk melakukan aksi ini.',
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
