const AIPredictionService = require('../services/aiPredictionService');
const AIBusinessInsightService = require('../services/aiBusinessInsightService');
const AIChatAssistantService = require('../services/aiChatAssistantService');
const AIRecommendationService = require('../services/aiRecommendationService');


const getPrediction = async (req, res, next) => {
  try {
    const forecastDays = parseInt(req.query.days) || 14;

    const data = await AIPredictionService.getSalesForecast(
      forecastDays
    );

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getBusinessInsights = async (req, res, next) => {
  try {
    const data =
      await AIBusinessInsightService.getBusinessHealthOverview();

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getSavedInsights = async (req, res, next) => {
  try {
    const data =
      await AIBusinessInsightService.getSavedInsights();

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getRecommendations = async (req, res, next) => {
  try {
    const data = await AIRecommendationService.getBasketAnalysis();

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getCrossSell = async (req, res, next) => {
  try {
    const productIds = req.body.product_ids || [];

    const data =
      await AIRecommendationService.getCrossSellRecommendations(
        productIds
      );

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const chatQuery = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Pesan tidak boleh kosong.',
      });
    }

    const data =
      await AIChatAssistantService.handleChatQuery(message);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPrediction,
  getRecommendations,
  getCrossSell,
  getBusinessInsights,
  getSavedInsights,
  chatQuery,
};