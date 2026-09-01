const { query } = require('../config/db');

const getDashboardStats = async (req, res, next) => {
  try {
    // ==========================================
    // TODAY
    // ==========================================

    const todayRes = await query(`
      SELECT
        COALESCE(SUM(final_amount), 0) AS today_revenue,
        COUNT(id) AS today_orders
      FROM transactions
      WHERE status = 'completed'
        AND DATE(created_at) = CURRENT_DATE;
    `);

    // ==========================================
    // MONTH VS LAST MONTH
    // ==========================================

    const monthRes = await query(`
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN created_at >= DATE_TRUNC('month', NOW())
              THEN final_amount
              ELSE 0
            END
          ),
          0
        ) AS this_month_revenue,

        COALESCE(
          SUM(
            CASE
              WHEN created_at >= DATE_TRUNC(
                'month',
                NOW() - INTERVAL '1 month'
              )
              AND created_at < DATE_TRUNC('month', NOW())
              THEN final_amount
              ELSE 0
            END
          ),
          0
        ) AS last_month_revenue
      FROM transactions
      WHERE status = 'completed';
    `);

    // ==========================================
    // PRODUCTS
    // ==========================================

    const totalProductsRes = await query(`
      SELECT
        COUNT(*) AS total,
        COUNT(
          CASE
            WHEN stock <= min_stock THEN 1
          END
        ) AS low_stock
      FROM products;
    `);

    // ==========================================
    // SALES CHART - LAST 7 DAYS
    // ==========================================

    const weekChartRes = await query(`
      SELECT
        TO_CHAR(
          DATE(created_at),
          'Dy, DD Mon'
        ) AS label,

        DATE(created_at) AS date,

        COALESCE(
          SUM(final_amount),
          0
        ) AS revenue,

        COUNT(id) AS orders

      FROM transactions

      WHERE status = 'completed'
        AND created_at >= NOW() - INTERVAL '7 days'

      GROUP BY DATE(created_at)

      ORDER BY date ASC;
    `);

    // ==========================================
    // TOP 5 PRODUCTS
    // ==========================================

    const topProductsRes = await query(`
      SELECT
        p.id,
        p.name,
        p.image_url,
        c.name AS category_name,

        COALESCE(
          SUM(td.quantity),
          0
        ) AS total_sold,

        COALESCE(
          SUM(td.subtotal),
          0
        ) AS total_revenue

      FROM products p

      LEFT JOIN categories c
        ON p.category_id = c.id

      LEFT JOIN transaction_details td
        ON p.id = td.product_id

      LEFT JOIN transactions t
        ON td.transaction_id = t.id
        AND t.created_at >= DATE_TRUNC(
          'month',
          NOW()
        )
        AND t.status = 'completed'

      GROUP BY
        p.id,
        c.name

      ORDER BY total_sold DESC

      LIMIT 5;
    `);

    // ==========================================
    // RECENT TRANSACTIONS
    // ==========================================

    const recentTxRes = await query(`
      SELECT
        t.id,
        t.invoice_no,
        t.final_amount,
        t.payment_method,
        t.status,
        t.created_at,
        u.name AS cashier_name

      FROM transactions t

      LEFT JOIN users u
        ON t.user_id = u.id

      WHERE t.status = 'completed'

      ORDER BY t.created_at DESC

      LIMIT 5;
    `);

    // ==========================================
    // AI INSIGHTS
    // ==========================================

    const insightsRes = await query(`
      SELECT *
      FROM ai_insights

      WHERE is_read = false

      ORDER BY score DESC

      LIMIT 3;
    `);

    // ==========================================
    // CALCULATE GROWTH
    // ==========================================

    const thisMonthRev =
      parseFloat(
        monthRes.rows[0].this_month_revenue
      ) || 0;

    const lastMonthRev =
      parseFloat(
        monthRes.rows[0].last_month_revenue
      ) || 0;

    const growthPct =
      lastMonthRev > 0
        ? parseFloat(
            (
              (
                (thisMonthRev - lastMonthRev) /
                lastMonthRev
              ) * 100
            ).toFixed(1)
          )
        : 0;

    // ==========================================
    // RESPONSE
    // ==========================================

    res.json({
      success: true,

      data: {
        summary: {
          todayRevenue:
            parseFloat(
              todayRes.rows[0].today_revenue
            ),

          todayOrders:
            parseInt(
              todayRes.rows[0].today_orders,
              10
            ),

          thisMonthRevenue:
            thisMonthRev,

          lastMonthRevenue:
            lastMonthRev,

          revenueGrowthPct:
            growthPct,

          totalProducts:
            parseInt(
              totalProductsRes.rows[0].total,
              10
            ),

          lowStockCount:
            parseInt(
              totalProductsRes.rows[0].low_stock,
              10
            ),
        },

        weekChart:
          weekChartRes.rows,

        topProducts:
          topProductsRes.rows,

        recentTransactions:
          recentTxRes.rows,

        aiInsights:
          insightsRes.rows,
      },
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
};