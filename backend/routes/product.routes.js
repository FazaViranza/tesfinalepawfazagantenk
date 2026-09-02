const router = require('express').Router();

const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require('../controllers/product.controller');

const {
  authenticate,
  authorize,
} = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', authorize(['owner', 'cashier']), getAll);
router.get('/:id', authorize(['owner', 'cashier']), getById);

// Owner-only management
router.post(
  '/',
  authenticate,
  authorize('owner'),
  create
);

router.put(
  '/:id',
  authenticate,
  authorize('owner'),
  update
);

router.delete(
  '/:id',
  authenticate,
  authorize('owner'),
  remove
);

module.exports = router;