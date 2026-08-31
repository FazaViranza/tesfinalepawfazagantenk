const router = require('express').Router();

const {
  getPrediction,
  getRecommendations,
  getCrossSell,
  getBusinessInsights,
  getSavedInsights,
  chatQuery,
} = require('../controllers/ai.controller');

const {
  authenticate,
  authorize,
} = require('../middleware/auth.middleware');

// Owner-only AI analytics
router.get(
  '/prediction',
  authenticate,
  authorize('admin'),
  getPrediction
);

router.get(
  '/recommendations',
  authenticate,
  authorize('admin'),
  getRecommendations
);

router.get(
  '/insights',
  authenticate,
  authorize('admin'),
  getBusinessInsights
);

router.get(
  '/insights/saved',
  authenticate,
  authorize('admin'),
  getSavedInsights
);

// Owner + Cashier
router.post(
  '/cross-sell',
  authenticate,
  authorize(['admin', 'cashier']),
  getCrossSell
);

// Customer chatbot — public
router.post('/chat', chatQuery);

module.exports = router;