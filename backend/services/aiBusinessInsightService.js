const { query } = require('../config/db');

/**
 * AI Business Health & Automated Insights Service
 * Menghitung indikator kesehatan finansial UMKM, mendeteksi anomali,
 * mengidentifikasi produk slow-moving/deadstock, serta menghasilkan saran operasional otomatis.
 */
class AIBusinessInsightService {
  /**
   * Mengambil rangkuman analisis kesehatan bisnis lengkap
   */
  static async getBusinessHealthOverview() {
    // 1. Finansial 30 Hari Terakhir: Total Revenue, Total HPP/Modal, Gross Profit
    const financialSql = `
      SELECT 
        COALESCE(SUM(t.final_amount), 0) as total_revenue,
        COALESCE(SUM(td.cost_price * td.quantity), 0) as total_cogs,
        COUNT(DISTINCT t.id) as total_orders
      FROM transactions t
      LEFT JOIN transaction_details td ON t.id = td.transaction_id
      WHERE t.status = 'completed' AND t.created_at >= NOW() - INTERVAL '30 days';
    `;
    const finRes = await query(financialSql);
    const totalRevenue = parseFloat(finRes.rows[0].total_revenue) || 0;
    const totalCOGS = parseFloat(finRes.rows[0].total_cogs) || 0;
    const totalOrders = parseInt(finRes.rows[0].total_orders, 10) || 0;
    
    const grossProfit = totalRevenue - totalCOGS;
    const grossMarginPct = totalRevenue > 0 ? parseFloat(((grossProfit / totalRevenue) * 100).toFixed(1)) : 0;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // 2. Pertumbuhan Finansial: Bandingkan 15 hari terakhir vs 15 hari sebelumnya
    const growthSql = `
      SELECT 
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '15 days' THEN final_amount ELSE 0 END), 0) as rev_recent,
        COALESCE(SUM(CASE WHEN created_at < NOW() - INTERVAL '15 days' AND created_at >= NOW() - INTERVAL '30 days' THEN final_amount ELSE 0 END), 0) as rev_prior
      FROM transactions
      WHERE status = 'completed';
    `;
    const growthRes = await query(growthSql);
    const revRecent = parseFloat(growthRes.rows[0].rev_recent) || 0;
    const revPrior = parseFloat(growthRes.rows[0].rev_prior) || 0;
    const growthPct = revPrior > 0 
      ? parseFloat((((revRecent - revPrior) / revPrior) * 100).toFixed(1)) 
      : 0;

    // 3. Kontribusi Pendapatan per Kategori
    const categorySql = `
      SELECT 
        c.name as category_name,
        c.icon,
        COALESCE(
          SUM(
            CASE
              WHEN t.id IS NOT NULL THEN td.subtotal
              ELSE 0
            END
          ),
          0
        ) as revenue,
        COALESCE(
          SUM(
            CASE
              WHEN t.id IS NOT NULL THEN td.quantity
              ELSE 0
            END
          ),
          0
        ) as units_sold
      FROM categories c
      JOIN products p
        ON c.id = p.category_id
      LEFT JOIN transaction_details td
        ON p.id = td.product_id
      LEFT JOIN transactions t
        ON td.transaction_id = t.id
        AND t.status = 'completed'
        AND t.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY c.id, c.name, c.icon
      ORDER BY revenue DESC;
    `;
    const catRes = await query(categorySql);
    const categoryBreakdown = catRes.rows.map(cat => ({
      name: cat.category_name,
      icon: cat.icon,
      revenue: parseFloat(cat.revenue),
      unitsSold: parseInt(cat.units_sold, 10),
      sharePct: totalRevenue > 0 ? parseFloat(((parseFloat(cat.revenue) / totalRevenue) * 100).toFixed(1)) : 0,
    }));

    // 4. Deteksi Produk Slow-Moving / Deadstock (Stok ada banyak tapi penjualan rendah dalam 30 hari)
    const deadstockSql = `
      SELECT 
        p.id,
        p.name,
        p.stock,
        p.price,
        p.cost_price,
        (p.stock * p.cost_price) as tied_up_capital,
        COALESCE(
          SUM(
            CASE
              WHEN t.id IS NOT NULL THEN td.quantity
              ELSE 0
            END
          ),
          0
        ) as sold_30d
      FROM products p
      LEFT JOIN transaction_details td
        ON p.id = td.product_id
      LEFT JOIN transactions t
        ON td.transaction_id = t.id
        AND t.created_at >= NOW() - INTERVAL '30 days'
        AND t.status = 'completed'
      WHERE p.stock > 0
      GROUP BY p.id
      HAVING COALESCE(
        SUM(
          CASE
            WHEN t.id IS NOT NULL THEN td.quantity
            ELSE 0
          END
        ),
        0
      ) <= 2
      ORDER BY tied_up_capital DESC;
    `;
    const deadstockRes = await query(deadstockSql);
    const slowMovingProducts = deadstockRes.rows.map(p => ({
      id: p.id,
      name: p.name,
      stock: parseInt(p.stock, 10),
      sold30d: parseInt(p.sold_30d, 10),
      tiedUpCapital: parseFloat(p.tied_up_capital),
      recommendation: 'Buat bundling promo diskon untuk mencairkan modal tertahan.',
    }));

    // 5. Generate Rekomendasi Aksi Cerdas Berbasis Skor Kesehatan Bisnis
    let healthScore = 70; // Base score
    if (grossMarginPct >= 50) healthScore += 15;
    else if (grossMarginPct >= 35) healthScore += 5;
    else healthScore -= 10;

    if (growthPct > 0) healthScore += 10;
    else if (growthPct < -10) healthScore -= 15;

    if (slowMovingProducts.length > 3) healthScore -= 5;
    healthScore = Math.min(98, Math.max(45, healthScore));

    const actionableTips = [];
    if (grossMarginPct < 45) {
      actionableTips.push({
        category: 'Profitabilitas',
        title: 'Evaluasi Efisiensi Biaya Bahan Baku (HPP)',
        detail: `Margin laba kotor saat ini ${grossMarginPct}%. Pertimbangkan evaluasi harga beli dan biaya operasional untuk mencapai target margin yang lebih sehat.`,
        impact: 'Tinggi',
      });
    }

    if (slowMovingProducts.length > 0) {
      const topSlow = slowMovingProducts[0];
      actionableTips.push({
        category: 'Manajemen Inventori',
        title: `Likuidasi Modal Tertahan pada ${topSlow.name}`,
        detail: `Terdapat dana modal sekitar Rp ${topSlow.tiedUpCapital.toLocaleString('id-ID')} tertahan di produk ini. Rekomendasikan program Flash Sale atau Free Gift pada pembelian di atas Rp 75.000.`,
        impact: 'Sedang',
      });
    }

    if (growthPct >= 10) {
      actionableTips.push({
        category: 'Peluang Ekspansi',
        title: 'Tren Pertumbuhan Positif (+ ' + growthPct + '%)',
        detail: 'Performa penjualan meningkat konsisten. Pertimbangkan menambah variasi produk yang relevan dengan kebutuhan pelanggan dan memastikan stok produk terlaris tetap tersedia.',
        impact: 'Tinggi',
      });
    } else {
      actionableTips.push({
        category: 'Pemasaran & Retensi',
        title: 'Tingkatkan Nilai Rata-rata Transaksi (AOV)',
        detail: `Rata-rata belanja pelanggan saat ini Rp ${avgOrderValue.toLocaleString('id-ID')}. Terapkan promo bundling produk seperti minuman dan cemilan untuk meningkatkan nilai transaksi pada sistem kasir POS.`,
        impact: 'Tinggi',
      });
    }

    return {
      financials: {
        totalRevenue,
        totalCOGS,
        grossProfit,
        grossMarginPct,
        totalOrders,
        avgOrderValue,
        growthPct,
      },
      healthScore,
      healthStatus: healthScore >= 80 ? 'Sangat Sehat' : healthScore >= 65 ? 'Stabil & Berkembang' : 'Perlu Perhatian',
      categoryBreakdown,
      slowMovingProducts,
      actionableTips,
    };
  }

  /**
   * Mengambil daftar AI Insights yang tersimpan di database
   */
  static async getSavedInsights() {
    const res = await query('SELECT * FROM ai_insights ORDER BY created_at DESC LIMIT 20');
    return res.rows;
  }
}

module.exports = AIBusinessInsightService;
