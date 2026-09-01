const router = require('express').Router();

const {
  getAll,
  create,
  update,
  remove,
} = require('../controllers/category.controller');

const {
  authenticate,
  authorize,
} = require('../middleware/auth.middleware');

// Public catalog
router.get('/', getAll);

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