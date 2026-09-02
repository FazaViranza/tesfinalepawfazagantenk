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

// Categories are internal application data.
router.use(authenticate);

// Owner + Cashier can read categories for the authenticated application.
router.get('/', authorize(['owner', 'cashier']), getAll);

// Owner-only management
router.post('/', authorize('owner'), create);
router.put('/:id', authorize('owner'), update);
router.delete('/:id', authorize('owner'), remove);

module.exports = router;
