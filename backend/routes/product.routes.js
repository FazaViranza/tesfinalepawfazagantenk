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

// Public catalog
router.get('/', getAll);
router.get('/:id', getById);

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