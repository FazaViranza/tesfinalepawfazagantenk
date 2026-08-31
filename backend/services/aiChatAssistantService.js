const { query } = require('../config/db');
const config = require('../config/env');

/**
 * AI Customer Chatbot
 *
 * Chatbot publik untuk membantu customer mendapatkan informasi
 * mengenai produk, harga, kategori, dan ketersediaan stok.
 *
 * Chatbot TIDAK memiliki akses ke:
 * - omzet
 * - profit
 * - transaksi
 * - data pelanggan
 * - business insight
 */

class AIChatAssistantService {

  /**
   * Mengambil katalog produk terbaru dari database.
   * Data ini digunakan sebagai context untuk Gemini.
   */
  static async getProductCatalog() {
    const result = await query(`
      SELECT
        p.id,
        p.name,
        p.price,
        p.stock,
        p.unit,
        p.description,
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY c.name ASC, p.name ASC
    `);

    return result.rows;
  }

  /**
   * Memproses pertanyaan customer.
   */
  static async handleChatQuery(userMessage = '') {
    const message = userMessage.trim();

    if (!message) {
      return {
        reply: 'Halo! 👋 Ada yang ingin kamu tanyakan tentang produk kami?',
        quickActions: [
          'Lihat produk',
          'Cari minuman',
          'Cari cemilan',
        ],
        source: 'umkm-ai-chatbot',
        timestamp: new Date().toISOString(),
      };
    }

    const products = await this.getProductCatalog();

    // Gunakan Gemini jika API key tersedia.
    if (config.geminiApiKey) {
      try {
        const responseText = await this.callGeminiAPI(
          message,
          products
        );

        if (responseText) {
          return {
            reply: responseText,
            quickActions: [
              'Ada minuman apa?',
              'Cari cemilan',
              'Produk apa yang tersedia?',
            ],
            source: 'gemini-ai',
            timestamp: new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn(
          'Gemini API error, menggunakan fallback chatbot:',
          err.message
        );
      }
    }

    // Fallback jika Gemini tidak tersedia.
    return this.localProductSearch(message, products);
  }

  /**
   * Fallback chatbot sederhana berbasis katalog.
   */
  static localProductSearch(userMessage, products) {
    const rawMessage = userMessage.toLowerCase();

    // Cari produk berdasarkan nama.
    const matchedProducts = products.filter((product) => {
      const productName = product.name.toLowerCase();
      const categoryName =
        product.category_name?.toLowerCase() || '';

      return (
        rawMessage.includes(productName) ||
        productName
          .split(' ')
          .some((word) =>
            word.length >= 4 &&
            rawMessage.includes(word)
          ) ||
        rawMessage.includes(categoryName)
      );
    });

    if (matchedProducts.length > 0) {
      const limitedProducts = matchedProducts.slice(0, 5);

      const productList = limitedProducts
        .map((product) => {
          const availability =
            product.stock > 0
              ? `tersedia (${product.stock} ${product.unit})`
              : 'stok habis';

          return (
            `• **${product.name}** — ` +
            `Rp ${parseFloat(product.price).toLocaleString('id-ID')} ` +
            `— ${availability}`
          );
        })
        .join('\n');

      return {
        reply:
          `Berikut produk yang sesuai dengan pertanyaanmu:\n\n` +
          productList,

        quickActions: [
          'Cari produk lain',
          'Lihat minuman',
          'Lihat cemilan',
        ],

        source: 'gemini-ai',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      reply:
        'Maaf, aku belum menemukan produk yang sesuai. 😅\n\n' +
        'Coba tanyakan nama produk atau kategorinya, misalnya:\n' +
        '• "Ada Aqua?"\n' +
        '• "Ada minuman apa?"\n' +
        '• "Ada cemilan?"\n' +
        '• "Ada Indomie?"',

      quickActions: [
        'Ada minuman apa?',
        'Ada cemilan apa?',
        'Ada mie instan?',
      ],

      source: 'gemini-ai',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Memanggil Gemini dengan konteks KATALOG PRODUK SAJA.
   */
  static async callGeminiAPI(userQuery, products) {

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`;

    const catalogText = products
      .map((product) => {
        const availability =
          product.stock > 0
            ? `Tersedia (${product.stock} ${product.unit})`
            : 'Stok habis';

        return (
          `- ${product.name} | ` +
          `Kategori: ${product.category_name || 'Lainnya'} | ` +
          `Harga: Rp ${parseFloat(product.price).toLocaleString('id-ID')} | ` +
          `${availability} | ` +
          `Deskripsi: ${product.description || '-'}`
        );
      })
      .join('\n');

    const systemPrompt = `
Anda adalah Customer Assistant untuk Warung Madura.

Tugas Anda hanya membantu customer mengenai katalog produk.

Anda boleh memberikan informasi tentang:
- nama produk
- kategori
- harga
- ketersediaan stok
- deskripsi produk

JANGAN memberikan atau mengarang informasi tentang:
- omzet toko
- keuntungan
- profit margin
- transaksi
- pelanggan
- data pribadi
- business insight
- prediksi penjualan
- strategi internal toko

Gunakan HANYA data katalog berikut sebagai sumber informasi:

${catalogText}

Jika produk tidak terdapat dalam katalog, katakan bahwa produk tersebut
tidak ditemukan dalam katalog saat ini.

Jangan mengarang harga, stok, atau produk.

Jawab dalam Bahasa Indonesia dengan ramah dan singkat.
`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                `${systemPrompt}\n\n` +
                `Pertanyaan customer: ${userQuery}`,
            },
          ],
        },
      ],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const data = await response.json();

    return data?.candidates?.[0]?.content?.parts?.[0]?.text;
  }
}

module.exports = AIChatAssistantService;