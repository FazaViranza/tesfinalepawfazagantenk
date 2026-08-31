const router = require('express').Router();
const { getAll, getById, create } = require('../controllers/transaction.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', authorize(['owner', 'cashier']), getAll);
router.get('/:id', authorize(['owner', 'cashier']), getById);
router.post('/', authorize('cashier'), create);

module.exports = router;