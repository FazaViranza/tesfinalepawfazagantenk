const router = require('express').Router();
const { getDashboardStats } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, getDashboardStats);

module.exports = router;
