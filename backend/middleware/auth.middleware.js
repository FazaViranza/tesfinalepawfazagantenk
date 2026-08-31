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

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Sesi login telah berakhir atau token tidak valid.',
    });
  }
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Akses tidak diizinkan. Silakan login terlebih dahulu.',
      });
    }

    if (typeof roles === 'string') {
      roles = [roles];
    }

    console.log('AUTH DEBUG:', req.user);
    console.log('REQUIRED ROLE:', roles);

    if (roles.length && !roles.includes(req.user.role)) {
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
