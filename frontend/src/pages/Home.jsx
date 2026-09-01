import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  ShoppingBag,
  Sparkles,
  MessageCircle,
  X,
  Send,
  Bot,
  User,
} from 'lucide-react';

import api from '../api';

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text:
        'Halo! 👋 Aku bisa membantu mencari informasi tentang produk, harga, kategori, dan ketersediaan stok.',
    },
  ]);

  const chatEndRef = useRef(null);

  // ==========================================
  // LOAD CATALOG
  // ==========================================

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true);
        setError('');

        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories'),
        ]);

        setProducts(productsRes.data || []);
        setCategories(categoriesRes.data || []);
      } catch (err) {
        console.error('Gagal memuat katalog:', err);

        setError(
          err.message || 'Gagal memuat katalog produk.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadCatalog();
  }, []);

  // ==========================================
  // AUTO SCROLL CHAT
  // ==========================================

  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({
        behavior: 'smooth',
      });
    }
  }, [messages, chatOpen]);

  // ==========================================
  // FILTER PRODUCTS
  // ==========================================

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const productName =
        product.name?.toLowerCase() || '';

      const categoryName =
        product.category_name?.toLowerCase() ||
        product.category?.name?.toLowerCase() ||
        '';

      const matchesSearch =
        !keyword ||
        productName.includes(keyword) ||
        categoryName.includes(keyword);

      const productCategoryId =
        product.category_id ??
        product.category?.id;

      const matchesCategory =
        selectedCategory === 'all' ||
        String(productCategoryId) === String(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  // ==========================================
  // RECOMMENDED PRODUCTS
  // ==========================================

  const recommendedProducts = useMemo(() => {
    return products
      .filter((product) => Number(product.stock) > 0)
      .slice(0, 4);
  }, [products]);

  // ==========================================
  // FORMAT PRICE
  // ==========================================

  const formatPrice = (price) => {
    return `Rp ${Number(price || 0).toLocaleString('id-ID')}`;
  };

  // ==========================================
  // SEND CHAT MESSAGE
  // ==========================================

  const sendMessage = async (messageOverride = null) => {
    const message =
      typeof messageOverride === 'string'
        ? messageOverride.trim()
        : chatInput.trim();

    if (!message || chatLoading) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: 'user',
        text: message,
      },
    ]);

    setChatInput('');
    setChatLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message,
      });

      const reply =
        response?.data?.reply ||
        'Maaf, aku belum mendapatkan jawaban.';

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: reply,
        },
      ]);
    } catch (err) {
      console.error('Chat AI error:', err);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text:
            err.message ||
            'Maaf, terjadi kesalahan saat menghubungi AI.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // ==========================================
  // ENTER TO SEND
  // ==========================================

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ==========================================
  // PRODUCT CARD
  // ==========================================

  const ProductCard = ({ product }) => {
    const stock = Number(product.stock || 0);

    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ShoppingBag className="w-12 h-12 text-gray-300" />
          )}
        </div>

        <div className="p-4">
          <p className="text-xs text-indigo-600 font-semibold mb-1">
            {product.category_name ||
              product.category?.name ||
              'Produk'}
          </p>

          <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[48px]">
            {product.name}
          </h3>

          <p className="text-lg font-bold text-gray-900 mt-2">
            {formatPrice(product.price)}
          </p>

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">
              {product.unit || 'pcs'}
            </span>

            {stock > 0 ? (
              <span className="text-xs font-medium text-green-600">
                Tersedia ({stock})
              </span>
            ) : (
              <span className="text-xs font-medium text-red-500">
                Stok habis
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-500 text-sm">
            Memuat katalog produk...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* ======================================
          NAVBAR
      ====================================== */}

      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">

          <div className="flex items-center justify-between gap-4">

            <div>
              <h1 className="text-xl font-bold text-gray-900">
                UMKM<span className="text-indigo-600">.AI</span>
              </h1>

              <p className="text-xs text-gray-500">
                Katalog Produk
              </p>
            </div>

            <div className="hidden md:block flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama produk..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />

              <span className="hidden sm:inline">
                Tanya AI
              </span>
            </button>

          </div>

          {/* Mobile Search */}

          <div className="md:hidden mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

        </div>
      </header>

      {/* ======================================
          HERO
      ====================================== */}

      <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20">

          <div className="max-w-2xl">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs font-medium mb-5">
              <Sparkles className="w-4 h-4" />
              Katalog UMKM.AI
            </div>

            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              Temukan kebutuhanmu
              <br />
              dengan mudah.
            </h2>

            <p className="mt-4 text-indigo-100 max-w-xl">
              Jelajahi berbagai produk yang tersedia,
              cari berdasarkan nama, atau pilih kategori
              yang kamu butuhkan.
            </p>

          </div>

        </div>
      </section>

      {/* ======================================
          CONTENT
      ====================================== */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {/* CATEGORY */}

        <section className="mb-10">

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              Kategori
            </h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">

            <button
              onClick={() => setSelectedCategory('all')}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Semua Produk
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() =>
                  setSelectedCategory(category.id)
                }
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  String(selectedCategory) === String(category.id)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}

          </div>

        </section>

        {/* RECOMMENDED */}

        {!search &&
          selectedCategory === 'all' &&
          recommendedProducts.length > 0 && (
            <section className="mb-12">

              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="w-5 h-5 text-indigo-600" />

                <h2 className="text-xl font-bold">
                  Produk Pilihan
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recommendedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>

            </section>
          )}

        {/* ALL PRODUCTS */}

        <section>

          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold">
                Semua Produk
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {filteredProducts.length} produk ditemukan
              </p>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">

              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />

              <h3 className="font-semibold text-gray-800">
                Produk tidak ditemukan
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Coba gunakan kata kunci atau kategori lain.
              </p>

            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">

              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}

            </div>
          )}

        </section>

      </main>

      {/* ======================================
          FLOATING CHAT BUTTON
      ====================================== */}

      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-40"
          title="Tanya AI"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* ======================================
          CHAT PANEL
      ====================================== */}

      {chatOpen && (
        <div className="fixed bottom-6 right-6 w-[calc(100vw-2rem)] sm:w-96 h-[560px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">

          {/* Header */}

          <div className="flex items-center justify-between px-4 py-4 bg-indigo-600 text-white">

            <div className="flex items-center gap-3">

              <div className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>

              <div>
                <p className="font-semibold">
                  UMKM.AI Assistant
                </p>

                <p className="text-xs text-indigo-100">
                  Tanya seputar produk
                </p>
              </div>

            </div>

            <button
              onClick={() => setChatOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

          </div>

          {/* Messages */}

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.role === 'user'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >

                {message.role === 'assistant' && (
                  <div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-sm whitespace-pre-line ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-white border border-gray-200 text-gray-700 rounded-tl-sm'
                  }`}
                >
                  {message.text}
                </div>

                {message.role === 'user' && (
                  <div className="w-7 h-7 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}

              </div>
            ))}

            {/* AI loading */}

            {chatLoading && (
              <div className="flex gap-2">

                <div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>

              </div>
            )}

            {/* Quick Actions */}

            {messages.length === 1 && !chatLoading && (
              <div className="pt-2 space-y-2">

                <p className="text-xs text-gray-400">
                  Coba tanyakan:
                </p>

                {[
                  'Ada minuman apa?',
                  'Ada cemilan apa?',
                  'Ada Indomie?',
                ].map((question) => (
                  <button
                    key={question}
                    onClick={() => sendMessage(question)}
                    className="block w-full text-left px-3 py-2 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    {question}
                  </button>
                ))}

              </div>
            )}

            <div ref={chatEndRef} />

          </div>

          {/* Input */}

          <div className="border-t border-gray-200 p-3 bg-white">

            <div className="flex items-end gap-2">

              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Tanya tentang produk..."
                rows={1}
                disabled={chatLoading}
                className="flex-1 resize-none max-h-24 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />

              <button
                onClick={() => sendMessage()}
                disabled={!chatInput.trim() || chatLoading}
                className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>

            </div>

            <p className="text-[10px] text-gray-400 mt-2 text-center">
              AI hanya memberikan informasi katalog produk.
            </p>

          </div>

        </div>
      )}

    </div>
  );
}

export default Home;