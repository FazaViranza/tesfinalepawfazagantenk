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

router.use(authenticate);

// Owner-only AI analytics
router.get('/prediction', authorize('owner'), getPrediction);
router.get('/recommendations', authorize('owner'), getRecommendations);
router.get('/insights', authorize('owner'), getBusinessInsights);
router.get('/insights/saved', authorize('owner'), getSavedInsights);

// Owner + Cashier: used by POS for product recommendations
router.post('/cross-sell', authorize(['owner', 'cashier']), getCrossSell);

// Owner-only business AI chatbot
router.post('/chat', authorize('owner'), chatQuery);

module.exports = router;
