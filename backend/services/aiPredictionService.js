const { query } = require('../config/db');

/**
 * AI Demand Forecasting & Restock Recommendation Service
 * Menggunakan Moving Average sederhana + Linear Regression untuk proyeksi.
 */
class AIPredictionService {
  static async getSalesForecast(forecastDays = 14) {
    const safeForecastDays = Number.isInteger(Number(forecastDays))
      ? Math.min(90, Math.max(1, Number(forecastDays)))
      : 14;

    const dailySalesSql = `
      SELECT
        DATE(created_at) as sale_date,
        COUNT(id) as total_orders,
        SUM(final_amount) as total_revenue
      FROM transactions
      WHERE status = 'completed'
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY sale_date ASC;
    `;

    const dailySalesRes = await query(dailySalesSql);
    const historicalData = dailySalesRes.rows.map((row) => ({
      date: new Date(row.sale_date).toISOString().split('T')[0],
      orders: parseInt(row.total_orders, 10) || 0,
      revenue: parseFloat(row.total_revenue || 0) || 0,
    }));

    let avgDailyRevenue = 0;
    let avgDailyOrders = 0;
    let slope = 0;

    if (historicalData.length > 0) {
      const n = historicalData.length;
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumX2 = 0;

      historicalData.forEach((day, index) => {
        const x = index + 1;
        const y = day.revenue;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      });

      avgDailyRevenue = sumY / n;
      avgDailyOrders = historicalData.reduce(
        (total, day) => total + day.orders,
        0
      ) / n;

      const denominator = n * sumX2 - sumX * sumX;
      if (denominator !== 0) {
        slope = (n * sumXY - sumX * sumY) / denominator;
      }
    }

    const hasHistoricalSales = historicalData.length > 0 && avgDailyRevenue > 0;
    const lastHistoricalDate = hasHistoricalSales
      ? new Date(historicalData[historicalData.length - 1].date)
      : new Date();

    const forecastData = [];
    let predictedTotalRevenue = 0;

    for (let i = 1; i <= safeForecastDays; i += 1) {
      const targetDate = new Date(lastHistoricalDate);
      targetDate.setDate(targetDate.getDate() + i);

      const dayOfWeek = targetDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const weekendMultiplier = isWeekend ? 1.25 : 0.95;

      let predictedRevenue = 0;
      let predictedOrders = 0;

      if (hasHistoricalSales) {
        const trendValue = avgDailyRevenue + slope * (historicalData.length + i);
        const baseRevenue = Math.max(0, trendValue);
        const noise = 1 + Math.sin(i * 1.5) * 0.05;

        predictedRevenue = Math.max(
          0,
          Math.round(baseRevenue * weekendMultiplier * noise)
        );

        const averageOrderValue = avgDailyOrders > 0
          ? avgDailyRevenue / avgDailyOrders
          : 0;

        predictedOrders = averageOrderValue > 0
          ? Math.max(0, Math.round(predictedRevenue / averageOrderValue))
          : 0;
      }

      predictedTotalRevenue += predictedRevenue;

      forecastData.push({
        date: targetDate.toISOString().split('T')[0],
        dayName: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dayOfWeek],
        predictedRevenue,
        predictedOrders,
        confidence: hasHistoricalSales
          ? Math.min(95, Math.max(70, Math.round(92 - i * 1.2)))
          : 0,
      });
    }

    const productSalesSql = `
      SELECT
        p.id,
        p.name,
        p.sku,
        p.stock,
        p.min_stock,
        p.price,
        p.cost_price,
        c.name as category_name,
        COALESCE(SUM(
          CASE
            WHEN t.id IS NOT NULL THEN td.quantity
            ELSE 0
          END
        ), 0) as units_sold_30d,
        COUNT(DISTINCT t.id) as transaction_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN transaction_details td ON p.id = td.product_id
      LEFT JOIN transactions t
        ON td.transaction_id = t.id
        AND t.created_at >= NOW() - INTERVAL '30 days'
        AND t.status = 'completed'
      GROUP BY p.id, c.name
      ORDER BY units_sold_30d DESC;
    `;

    const productSalesRes = await query(productSalesSql);

    const productForecasts = productSalesRes.rows.map((prod) => {
      const currentStock = Math.max(0, parseInt(prod.stock, 10) || 0);
      const minStock = Math.max(0, parseInt(prod.min_stock, 10) || 0);
      const unitsSold30d = Math.max(0, parseInt(prod.units_sold_30d, 10) || 0);
      const price = Math.max(0, parseFloat(prod.price) || 0);
      const costPrice = Math.max(0, parseFloat(prod.cost_price) || 0);

      const dailyVelocity = unitsSold30d / 30;
      const forecastDemandUnits = Math.round(dailyVelocity * safeForecastDays * 1.05);
      const daysUntilStockout = dailyVelocity > 0
        ? parseFloat((currentStock / dailyVelocity).toFixed(1))
        : null;

      const leadTimeDays = 2;
      const reorderPoint = Math.ceil(dailyVelocity * leadTimeDays) + minStock;
      const isUrgent = currentStock <= minStock || (
        dailyVelocity > 0 && currentStock / dailyVelocity <= 3
      );
      const recommendedRestock = isUrgent
        ? Math.max(0, Math.ceil(dailyVelocity * 14) - currentStock)
        : 0;

      let riskLevel = 'Aman';
      if (currentStock === 0) riskLevel = 'Habis';
      else if (isUrgent) riskLevel = 'Kritis';
      else if (dailyVelocity > 0 && currentStock / dailyVelocity <= 7) riskLevel = 'Perhatian';

      return {
        productId: prod.id,
        name: prod.name,
        sku: prod.sku,
        category: prod.category_name,
        currentStock,
        minStock,
        price,
        costPrice,
        unitsSold30d,
        dailyVelocity: parseFloat(dailyVelocity.toFixed(2)),
        forecastDemandUnits,
        daysUntilStockout: daysUntilStockout === null
          ? 'Tidak ada penjualan 30 hari'
          : daysUntilStockout > 90
            ? '> 90 hari'
            : `${daysUntilStockout} hari`,
        reorderPoint,
        recommendedRestock,
        riskLevel,
        estimatedRestockCost: recommendedRestock * costPrice,
      };
    });

    return {
      summary: {
        forecastDays: safeForecastDays,
        hasHistoricalSales,
        predictedTotalRevenue,
        avgDailyRevenue: Math.round(avgDailyRevenue),
        growthTrendPct: avgDailyRevenue > 0
          ? parseFloat(((slope / avgDailyRevenue) * 100).toFixed(2))
          : 0,
        criticalStockCount: productForecasts.filter(
          (product) => product.riskLevel === 'Kritis' || product.riskLevel === 'Habis'
        ).length,
      },
      historicalData,
      forecastData,
      productForecasts,
    };
  }
}

module.exports = AIPredictionService;
