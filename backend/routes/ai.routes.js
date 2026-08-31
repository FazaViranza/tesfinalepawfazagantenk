const router = require('express').Router();
const {
  getPrediction, getRecommendations, getCrossSell,
  getBusinessInsights, getSavedInsights, chatQuery,
} = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/prediction', getPrediction);
router.get('/recommendations', getRecommendations);
router.post('/cross-sell', getCrossSell);
router.get('/insights', getBusinessInsights);
router.get('/insights/saved', getSavedInsights);
router.post('/chat', chatQuery);

module.exports = router;
