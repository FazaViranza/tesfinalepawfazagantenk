const { query } = require('../config/db');

/**
 * AI Product Recommendation & Market Basket Analysis Service
 * Menggunakan algoritma Association Rule Mining (Apriori Logic)
 * untuk menemukan pola belanja produk bersamaan dan menghasilkan rekomendasi bundling pintar.
 */
class AIRecommendationService {
  /**
   * Mengambil analisis keranjang belanja (Market Basket Analysis) & pasangan produk terkuat
   */
  static async getBasketAnalysis() {
    // 1. Ambil transaksi yang memiliki lebih dari 1 item
    const basketsSql = `
      SELECT 
        td.transaction_id,
        ARRAY_AGG(td.product_id) as product_ids,
        ARRAY_AGG(td.product_name) as product_names
      FROM transaction_details td
      JOIN transactions t ON td.transaction_id = t.id
      WHERE t.status = 'completed'
      GROUP BY td.transaction_id
      HAVING COUNT(td.product_id) > 1;
    `;
    const basketsRes = await query(basketsSql);
    const baskets = basketsRes.rows;

    const totalTransactionsRes = await query(`SELECT COUNT(*) as count FROM transactions WHERE status = 'completed'`);
    const totalTransactions = parseInt(totalTransactionsRes.rows[0].count, 10) || 1;

    // Ambil info produk lengkap
    const productsRes = await query('SELECT id, name, price, cost_price, image_url FROM products');
    const productMap = {};
    productsRes.rows.forEach(p => {
      productMap[p.id] = {
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        costPrice: parseFloat(p.cost_price),
        imageUrl: p.image_url,
      };
    });

    // 2. Hitung frekuensi produk individual & frekuensi pasangan (Co-occurrence)
    const itemFreq = {};
    const pairFreq = {};

    baskets.forEach(basket => {
      const uniqueIds = [...new Set(basket.product_ids)];

      // Hitung individual frequency
      uniqueIds.forEach(id => {
        itemFreq[id] = (itemFreq[id] || 0) + 1;
      });

      // Hitung pair frequency
      for (let i = 0; i < uniqueIds.length; i++) {
        for (let j = i + 1; j < uniqueIds.length; j++) {
          const idA = Math.min(uniqueIds[i], uniqueIds[j]);
          const idB = Math.max(uniqueIds[i], uniqueIds[j]);
          const pairKey = `${idA}_${idB}`;

          pairFreq[pairKey] = (pairFreq[pairKey] || 0) + 1;
        }
      }
    });

    // 3. Hitung metrik Association Rules (Support, Confidence, Lift)
    const rules = [];

    Object.entries(pairFreq).forEach(([pairKey, pairCount]) => {
      const [idA, idB] = pairKey.split('_').map(Number);
      const prodA = productMap[idA];
      const prodB = productMap[idB];

      if (!prodA || !prodB) return;

      const supportPair = pairCount / totalTransactions;
      const countA = itemFreq[idA] || 1;
      const countB = itemFreq[idB] || 1;

      // Rule 1: A -> B
      const confAtoB = pairCount / countA;
      const liftAtoB = confAtoB / (countB / totalTransactions);

      // Rule 2: B -> A
      const confBtoA = pairCount / countB;
      const liftBtoA = confBtoA / (countA / totalTransactions);

      // Gunakan aturan dengan confidence tertinggi
      const bestRule = confAtoB >= confBtoA 
        ? { base: prodA, target: prodB, confidence: confAtoB, lift: liftAtoB }
        : { base: prodB, target: prodA, confidence: confBtoA, lift: liftBtoA };

      const normalTotalPrice = prodA.price + prodB.price;
      const totalCostPrice = prodA.costPrice + prodB.costPrice;
      const suggestedDiscountPct = 10; // Diskon bundling 10%
      const bundlePrice = Math.round((normalTotalPrice * (1 - suggestedDiscountPct / 100)) / 1000) * 1000;
      const bundleProfit = bundlePrice - totalCostPrice;
      const marginPct = parseFloat(((bundleProfit / bundlePrice) * 100).toFixed(1));

      rules.push({
        pairId: pairKey,
        pairCount,
        supportPct: parseFloat((supportPair * 100).toFixed(1)),
        confidencePct: parseFloat((bestRule.confidence * 100).toFixed(1)),
        lift: parseFloat(bestRule.lift.toFixed(2)),
        productA: prodA,
        productB: prodB,
        baseProduct: bestRule.base,
        recommendedProduct: bestRule.target,
        bundleSuggestion: {
          name: `Paket Hemat: ${prodA.name.split(' ')[0]} + ${prodB.name.split(' ')[0]}`,
          normalPrice: normalTotalPrice,
          bundlePrice,
          savings: normalTotalPrice - bundlePrice,
          marginPct,
        },
      });
    });

    // Urutkan berdasarkan nilai confidence dan frekuensi kemunculan
    rules.sort((a, b) => b.confidencePct - a.confidencePct || b.pairCount - a.pairCount);

    return {
      totalAnalyzedBaskets: baskets.length,
      totalTransactions,
      topAssociations: rules.slice(0, 10),
    };
  }

  /**
   * Rekomendasi Cross-selling real-time untuk POS Kasir berdasarkan item yang ada di keranjang
   * @param {Array<number>} currentProductIds - ID produk di keranjang kasir
   */
  static async getCrossSellRecommendations(currentProductIds = []) {
    if (!currentProductIds || currentProductIds.length === 0) {
      // Ambil top 3 best seller umum jika keranjang kosong
      const topSql = `
        SELECT p.id, p.name, p.price, p.image_url, COALESCE(SUM(td.quantity), 0) as total_sold
        FROM products p
        LEFT JOIN transaction_details td ON p.id = td.product_id
        GROUP BY p.id
        ORDER BY total_sold DESC
        LIMIT 4;
      `;
      const topRes = await query(topSql);
      return topRes.rows.map(r => ({
        id: r.id,
        name: r.name,
        price: parseFloat(r.price),
        imageUrl: r.image_url,
        reason: 'Produk Terlaris Minggu Ini',
      }));
    }

    const { topAssociations } = await this.getBasketAnalysis();
    const recommendations = [];
    const addedIds = new Set(currentProductIds);

    for (const rule of topAssociations) {
      if (currentProductIds.includes(rule.baseProduct.id) && !addedIds.has(rule.recommendedProduct.id)) {
        recommendations.push({
          ...rule.recommendedProduct,
          confidencePct: rule.confidencePct,
          reason: `Sering dibeli bersama ${rule.baseProduct.name} (${rule.confidencePct}% kecocokan)`,
        });
        addedIds.add(rule.recommendedProduct.id);
      } else if (currentProductIds.includes(rule.recommendedProduct.id) && !addedIds.has(rule.baseProduct.id)) {
        recommendations.push({
          ...rule.baseProduct,
          confidencePct: rule.confidencePct,
          reason: `Pelengkap favorit untuk ${rule.recommendedProduct.name} (${rule.confidencePct}% kecocokan)`,
        });
        addedIds.add(rule.baseProduct.id);
      }

      if (recommendations.length >= 4) break;
    }

    // Fallback jika belum ada pasangan kuat
    if (recommendations.length < 3) {
      const fallbackSql = `
        SELECT id, name, price, image_url 
        FROM products 
        WHERE id != ALL($1::int[]) AND stock > 0
        ORDER BY price ASC 
        LIMIT $2;
      `;
      const fallbackRes = await query(fallbackSql, [currentProductIds, 4 - recommendations.length]);
      fallbackRes.rows.forEach(r => {
        if (!addedIds.has(r.id)) {
          recommendations.push({
            id: r.id,
            name: r.name,
            price: parseFloat(r.price),
            imageUrl: r.image_url,
            reason: 'Rekomendasi Camilan Pendamping',
          });
        }
      });
    }

    return recommendations;
  }
}

module.exports = AIRecommendationService;
