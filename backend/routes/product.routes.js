const router = require('express').Router();
const { getAll, getById, create, update, remove } = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', authorize('owner'), create);
router.put('/:id', authorize('owner'), update);
router.delete('/:id', authorize('owner'), remove);

module.exports = router;
