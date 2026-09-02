const router = require('express').Router();

const {
  getAllCashiers,
  getCashierById,
  createCashier,
  updateCashier,
  deleteCashier,
} = require('../controllers/user.controller');

const {
  authenticate,
  authorize,
} = require('../middleware/auth.middleware');

// Semua endpoint di bawah ini:
// wajib login + hanya Owner
router.use(authenticate);
router.use(authorize('owner'));

router.get('/', getAllCashiers);
router.get('/:id', getCashierById);
router.post('/', createCashier);
router.put('/:id', updateCashier);
router.delete('/:id', deleteCashier);

module.exports = router;