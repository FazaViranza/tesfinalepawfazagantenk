const router = require('express').Router();
const { getAll, create, update, remove } = require('../controllers/category.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', getAll);
router.post('/', authorize('owner'), create);
router.put('/:id', authorize('owner'), update);
router.delete('/:id', authorize('owner'), remove);

module.exports = router;
