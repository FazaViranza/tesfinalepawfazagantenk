const router = require('express').Router();

const {
  login,
  getMe,
} = require('../controllers/auth.controller');

const {
  authenticate,
} = require('../middleware/auth.middleware');

// Public
router.post('/login', login);

// Protected
router.get('/me', authenticate, getMe);

module.exports = router;