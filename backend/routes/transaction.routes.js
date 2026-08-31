const router = require('express').Router();
const { getAll, getById, create } = require('../controllers/transaction.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);

module.exports = router;
