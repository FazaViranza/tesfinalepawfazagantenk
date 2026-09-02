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
  authorize('owner'),
  getPrediction
);

router.get(
  '/recommendations',
  authenticate,
  authorize('owner'),
  getRecommendations
);

router.get(
  '/insights',
  authenticate,
  authorize('owner'),
  getBusinessInsights
);

router.get(
  '/insights/saved',
  authenticate,
  authorize('owner'),
  getSavedInsights
);

// Owner + Cashier
router.post(
  '/cross-sell',
  authenticate,
  authorize(['owner', 'cashier']),
  getCrossSell
);


router.post(
  '/chat',
  authenticate,
  authorize('owner'),
  chatQuery
);

module.exports = router;