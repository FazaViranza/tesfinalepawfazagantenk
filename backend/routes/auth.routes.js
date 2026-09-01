const router = require('express').Router();

const { getDashboardStats } = require('../controllers/dashboard.controller');
const {
  authenticate,
  authorize,
} = require('../middleware/auth.middleware');

router.get(
  '/',
  authenticate,
  authorize('owner'),
  getDashboardStats
);

module.exports = router;