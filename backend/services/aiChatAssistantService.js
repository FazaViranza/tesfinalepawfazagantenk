const { query } = require('../config/db');
const config = require('../config/env');
const AIPredictionService = require('./aiPredictionService');
const AIRecommendationService = require('./aiRecommendationService');
const AIBusinessInsightService = require('./aiBusinessInsightService');

/**
 * AI Chat Assistant & Business Advisor Service
 * Asisten cerdas tanya-jawab interaktif untuk UMKM berbasis data langsung dari database.
 */
class AIChatAssistantService {
  /**
   * Mengumpulkan snapshot data bisnis terkini sebagai konteks AI
   */
  static async getLiveStoreContext() {
    // 1. Omset Hari Ini & Minggu Ini
    const revTodayRes = await query(`
      SELECT COALESCE(SUM(final_amount), 0) as today_rev, COUNT(id) as today_orders
      FROM transactions
      WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE;
    `);
    const todayRev = parseFloat(revTodayRes.rows[0].today_rev) || 0;
    const todayOrders = parseInt(revTodayRes.rows[0].today_orders, 10) || 0;

    const revMonthRes = await query(`
      SELECT COALESCE(SUM(final_amount), 0) as month_rev, COUNT(id) as month_orders
      FROM transactions
      WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days';
    `);
    const monthRev = parseFloat(revMonthRes.rows[0].month_rev) || 0;
    const monthOrders = parseInt(revMonthRes.rows[0].month_orders, 10) || 0;

    // 2. Produk Stok Kritis
    const lowStockRes = await query(`
      SELECT name, stock, min_stock 
      FROM products 
      WHERE stock <= min_stock 
      ORDER BY stock ASC;
    `);
    const lowStockItems = lowStockRes.rows;

    // 3. Top 3 Produk Terlaris
    const topProdRes = await query(`
      SELECT p.name, COALESCE(SUM(td.quantity), 0) as sold
      FROM products p
      JOIN transaction_details td ON p.id = td.product_id
      JOIN transactions t ON td.transaction_id = t.id AND t.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY p.id, p.name
      ORDER BY sold DESC
      LIMIT 3;
    `);
    const topProducts = topProdRes.rows;

    // 4. Pelanggan Paling Loyal
    const topCustRes = await query(`
      SELECT name, total_spent, total_orders, member_tier
      FROM customers
      ORDER BY total_spent DESC
      LIMIT 3;
    `);
    const topCustomers = topCustRes.rows;

    return {
      todayRev,
      todayOrders,
      monthRev,
      monthOrders,
      lowStockItems,
      topProducts,
      topCustomers,
    };
  }

  /**
   * Memproses pesan chat dari pengguna dan mengembalikan respon analitik AI
   * @param {string} userMessage - Pesan dari user/pelaku UMKM
   */
  static async handleChatQuery(userMessage = '') {
    const rawMsg = userMessage.trim().toLowerCase();
    const context = await this.getLiveStoreContext();

    // 1. Jika ada API KEY Gemini, coba gunakan LLM dengan injected database context
    if (config.geminiApiKey) {
      try {
        const responseText = await this.callGeminiAPI(userMessage, context);
        if (responseText) {
          return {
            reply: responseText,
            source: 'gemini-ai',
            timestamp: new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn('Gemini API error, fallback to local AI engine:', err.message);
      }
    }

    // 2. Engine AI Lokal Cerdas (Context-Aware Natural Language Processing)
    let reply = '';
    let quickActions = [];

    if (rawMsg.includes('omset') || rawMsg.includes('pendapatan') || rawMsg.includes('penjualan') || rawMsg.includes('laba')) {
      reply = `📊 **Ringkasan Pendapatan Toko Anda:**\n\n` +
        `• **Hari Ini:** Rp ${context.todayRev.toLocaleString('id-ID')} (${context.todayOrders} transaksi)\n` +
        `• **30 Hari Terakhir:** Rp ${context.monthRev.toLocaleString('id-ID')} (${context.monthOrders} transaksi)\n\n` +
        `💡 *Analisis AI:* Penjualan rata-rata per transaksi berada di kisaran Rp ${(context.monthOrders > 0 ? Math.round(context.monthRev / context.monthOrders) : 0).toLocaleString('id-ID')}. Anda dapat meningkatkan omset dengan strategi bundling produk komplementer.`;
      
      quickActions = ['Lihat Grafik Prediksi Permintaan', 'Cek Produk Terlaris', 'Rekomendasi Paket Promo'];

    } else if (rawMsg.includes('stok') || rawMsg.includes('habis') || rawMsg.includes('restock') || rawMsg.includes('menipis')) {
      if (context.lowStockItems.length > 0) {
        const listText = context.lowStockItems.map(i => `• **${i.name}**: Tersisa **${i.stock}** unit (Batas min: ${i.min_stock})`).join('\n');
        reply = `⚠️ **Peringatan Stok Rendah:**\n\n` +
          `Ditemukan **${context.lowStockItems.length} produk** yang berada di bawah ambang batas minimum:\n\n` +
          `${listText}\n\n` +
          `🚀 *Rekomendasi AI:* Segera buat Purchase Order (PO) atau restock bahan baku sebelum akhir pekan agar tidak kehilangan potensi penjualan.`;
      } else {
        reply = `✅ **Semua Stok Dalam Kondisi Aman!**\n\nSaat ini tidak ada produk yang berada di bawah batas minimum stok. Seluruh inventori siap melayani pesanan.`;
      }
      quickActions = ['Buka Halaman Produk', 'Hitung Estimasi Kebutuhan Restock', 'Analisis Deadstock'];

    } else if (rawMsg.includes('laris') || rawMsg.includes('favorit') || rawMsg.includes('bestseller') || rawMsg.includes('terbanyak')) {
      const topList = context.topProducts.map((p, idx) => `${idx + 1}. **${p.name}** — Terjual **${p.sold}** porsi/unit`).join('\n');
      reply = `🏆 **Top 3 Produk Terlaris (30 Hari Terakhir):**\n\n` +
        `${topList}\n\n` +
        `💡 *Strategi AI:* Pertahankan konsistensi rasa dan ketersediaan stok untuk produk-produk unggulan ini, dan jadikan produk tersebut sebagai pemicu (*anchor*) dalam paket promo.`;
      quickActions = ['Buat Paket Promo Bundling', 'Lihat Analisis Keranjang Belanja', 'Cek Pelanggan Loyal'];

    } else if (rawMsg.includes('promo') || rawMsg.includes('diskon') || rawMsg.includes('rekomendasi') || rawMsg.includes('bundling') || rawMsg.includes('strategi')) {
      reply = `🎯 **Rekomendasi Strategi & Promo AI untuk UMKM Anda:**\n\n` +
        `1. **Paket Duet Hemat (Kopi + Pastry):** Terapkan diskon 10-15% saat pelanggan membeli Kopi Susu bersama Croissant / Roti Bakar.\n` +
        `2. **Happy Hour Sore (15:00 - 18:00):** Berikan voucher diskon Rp 5.000 untuk pembelian minimal Rp 40.000 guna mendongkrak jam sepi.\n` +
        `3. **Reward Pelanggan Loyal:** Berikan gratis 1 minuman setelah 10 kali transaksi untuk anggota tier Gold/Platinum.`;
      quickActions = ['Buka Menu POS Kasir', 'Lihat Prediksi Permintaan', 'Cek Kesehatan Bisnis'];

    } else if (rawMsg.includes('pelanggan') || rawMsg.includes('customer') || rawMsg.includes('loyal') || rawMsg.includes('member')) {
      const custList = context.topCustomers.map((c, idx) => `${idx + 1}. **${c.name}** (${c.member_tier}) — Total Belanja: Rp ${parseFloat(c.total_spent).toLocaleString('id-ID')} (${c.total_orders}x order)`).join('\n');
      reply = `👥 **Pelanggan Paling Loyal Toko Anda:**\n\n` +
        `${custList}\n\n` +
        `💡 *Saran AI:* Kirimkan ucapan terima kasih personal atau penawaran eksklusif kepada pelanggan tier Platinum untuk menjaga retensi dan repeat-order.`;
      quickActions = ['Lihat Semua Pelanggan', 'Buat Promo Khusus Member'];

    } else {
      reply = `Halo! Saya adalah **Asisten Bisnis UMKM.AI** 🤖.\n\n` +
        `Saya dapat membantu Anda menganalisis performa toko, memeriksa stok kritis, memproyeksikan permintaan, serta merancang strategi promo berbasis data.\n\n` +
        `**Contoh pertanyaan yang bisa Anda ajukan:**\n` +
        `• "Berapa total omset dan penjualan hari ini?"\n` +
        `• "Produk apa saja yang stoknya menipis?"\n` +
        `• "Apa saja produk paling laris bulan ini?"\n` +
        `• "Berikan rekomendasi paket promo akhir pekan."\n` +
        `• "Siapa pelanggan paling sering belanja?"`;
      quickActions = ['Cek Omset Hari Ini', 'Cek Stok Menipis', 'Rekomendasi Promo AI', 'Prediksi Penjualan'];
    }

    return {
      reply,
      quickActions,
      source: 'umkm-ai-nlp-engine',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Helper pemanggil Gemini API jika KEY disediakan di .env
   */
  static async callGeminiAPI(userQuery, context) {
    // Optional integration via direct fetch
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`;
    
    const systemPrompt = `Anda adalah Asisten Bisnis AI untuk platform UMKM.AI di Indonesia.
Jawab pertanyaan pemilik UMKM secara ramah, profesional, padat, dan berbasis data berikut:
- Omset Hari Ini: Rp ${context.todayRev.toLocaleString('id-ID')} (${context.todayOrders} order)
- Omset 30 Hari: Rp ${context.monthRev.toLocaleString('id-ID')} (${context.monthOrders} order)
- Produk Stok Kritis: ${context.lowStockItems.map(i => `${i.name} (sisa ${i.stock})`).join(', ') || 'Semua aman'}
- Top 3 Produk: ${context.topProducts.map(p => `${p.name} (${p.sold} terjual)`).join(', ')}
- Pelanggan Top: ${context.topCustomers.map(c => `${c.name} (${c.member_tier})`).join(', ')}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nPertanyaan Pemilik UMKM: ${userQuery}` }],
        },
      ],
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text;
  }
}

module.exports = AIChatAssistantService;
