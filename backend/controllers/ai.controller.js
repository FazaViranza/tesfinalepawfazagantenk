const AIPredictionService = require('../services/aiPredictionService');
const AIBusinessInsightService = require('../services/aiBusinessInsightService');
const AIChatAssistantService = require('../services/aiChatAssistantService');
const AIRecommendationService = require('../services/aiRecommendationService');

const MAX_FORECAST_DAYS = 30;
const MAX_CROSS_SELL_PRODUCTS = 100;
const MAX_CHAT_LENGTH = 2000;

const getPrediction = async (req, res, next) => {
  try {
    const rawDays = req.query.days;
    const forecastDays = rawDays === undefined ? 14 : Number(rawDays);

    if (
      !Number.isInteger(forecastDays) ||
      forecastDays < 1 ||
      forecastDays > MAX_FORECAST_DAYS
    ) {
      return res.status(400).json({
        success: false,
        message: `Jumlah hari prediksi harus berupa bilangan bulat 1-${MAX_FORECAST_DAYS}.`,
      });
    }

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
    const { product_ids: rawProductIds = [] } = req.body || {};

    if (!Array.isArray(rawProductIds)) {
      return res.status(400).json({
        success: false,
        message: 'product_ids harus berupa array.',
      });
    }

    if (rawProductIds.length > MAX_CROSS_SELL_PRODUCTS) {
      return res.status(400).json({
        success: false,
        message: `Maksimal ${MAX_CROSS_SELL_PRODUCTS} product ID.`,
      });
    }

    const productIds = rawProductIds.map(Number);

    if (
      productIds.some(
        (id) => !Number.isInteger(id) || id < 1
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Setiap product ID harus berupa bilangan bulat positif.',
      });
    }

    const uniqueProductIds = [...new Set(productIds)];

    const data =
      await AIRecommendationService.getCrossSellRecommendations(
        uniqueProductIds
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
    const { message } = req.body || {};

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Pesan tidak boleh kosong.',
      });
    }

    if (message.trim().length > MAX_CHAT_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Pesan maksimal ${MAX_CHAT_LENGTH} karakter.`,
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
