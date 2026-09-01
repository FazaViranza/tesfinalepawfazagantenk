import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  CreditCard,
  CheckCircle2,
  Bot,
} from 'lucide-react';

const formatRp = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v || 0);

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [search, setSearch] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');

  const [discount, setDiscount] = useState(0);

  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  // ==========================================
  // LOAD PRODUCTS
  // ==========================================

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      setError('');

      const response = await api.get('/products');

      setProducts(response.data || []);
    } catch (err) {
      console.error('Gagal memuat produk:', err);

      setError(
        err.message || 'Gagal memuat produk.'
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ==========================================
  // AI CROSS-SELL RECOMMENDATION
  // ==========================================

  useEffect(() => {
    if (cart.length === 0) {
      setRecommendations([]);
      return;
    }

    api
      .post('/ai/cross-sell', {
        product_ids: cart.map((item) => item.id),
      })
      .then((response) => {
        setRecommendations(response.data || []);
      })
      .catch(() => {
        setRecommendations([]);
      });
  }, [cart]);

  // ==========================================
  // FILTER PRODUCTS
  // ==========================================

  const filteredProducts = products.filter((product) =>
    product.name
      .toLowerCase()
      .includes(search.toLowerCase()) &&
    Number(product.stock) > 0
  );

  // ==========================================
  // CART
  // ==========================================

  const addToCart = (product) => {
    setError('');

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id
      );

      if (existing) {
        if (existing.qty >= Number(product.stock)) {
          return prev;
        }

        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                qty: item.qty + 1,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          ...product,
          qty: 1,
        },
      ];
    });
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) {
      setCart((prev) =>
        prev.filter((item) => item.id !== id)
      );

      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              qty: Math.min(
                qty,
                Number(item.stock)
              ),
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setPaidAmount('');
    setError('');
  };

  // ==========================================
  // TOTALS
  // ==========================================

  const total = cart.reduce(
    (sum, item) =>
      sum +
      parseFloat(item.price) *
        item.qty,
    0
  );

  const finalAmount = Math.max(
    0,
    total - Number(discount || 0)
  );

  const paid =
    paymentMethod === 'cash'
      ? parseFloat(paidAmount || 0)
      : finalAmount;

  const change =
    paymentMethod === 'cash'
      ? Math.max(
          0,
          paid - finalAmount
        )
      : 0;

  // ==========================================
  // CHECKOUT
  // ==========================================

  const handleCheckout = async () => {
    setError('');

    if (cart.length === 0) {
      setError(
        'Keranjang masih kosong.'
      );
      return;
    }

    if (
      Number(discount) < 0 ||
      Number(discount) > total
    ) {
      setError(
        'Nominal diskon tidak valid.'
      );
      return;
    }

    if (
      paymentMethod === 'cash' &&
      paid < finalAmount
    ) {
      setError(
        'Jumlah uang yang diterima kurang dari total pembayaran.'
      );
      return;
    }

    setProcessing(true);

    try {
      const response = await api.post(
        '/transactions',
        {
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.qty,
          })),

          discount_amount: Number(
            discount || 0
          ),

          payment_method:
            paymentMethod,

          paid_amount:
            paymentMethod === 'cash'
              ? Number(paidAmount)
              : finalAmount,
        }
      );

      setReceipt(response.data);
      setReceiptOpen(true);

      clearCart();

      // Refresh stock
      await loadProducts();
    } catch (err) {
      console.error(
        'Checkout error:',
        err
      );

      setError(
        err.message ||
          'Transaksi gagal diproses.'
      );
    } finally {
      setProcessing(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loadingProducts) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />

          <p className="text-sm text-gray-400">
            Memuat produk...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="flex gap-5 h-[calc(100vh-8rem)]">

      {/* ======================================
          LEFT — PRODUCTS
      ====================================== */}

      <div className="flex-1 flex flex-col gap-4 overflow-hidden">

        {/* Search */}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Cari produk..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Error */}

        {error && (
          <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Product Grid */}

        <div className="flex-1 overflow-y-auto">

          {filteredProducts.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              Produk tidak ditemukan.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">

              {filteredProducts.map(
                (product) => (
                  <button
                    key={product.id}
                    onClick={() =>
                      addToCart(product)
                    }
                    className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-left hover:border-indigo-500/50 hover:bg-gray-800/50 transition-all active:scale-95"
                  >

                    <img
                      src={
                        product.image_url ||
                        'https://placehold.co/80x80/1f2937/6366f1?text=P'
                      }
                      alt={product.name}
                      className="w-full h-20 object-cover rounded-lg mb-2.5"
                      onError={(e) => {
                        e.target.src =
                          'https://placehold.co/80x80/1f2937/6366f1?text=P';
                      }}
                    />

                    <p className="text-xs font-semibold text-white line-clamp-2 mb-1">
                      {product.name}
                    </p>

                    <p className="text-xs font-bold text-indigo-400">
                      {formatRp(
                        product.price
                      )}
                    </p>

                    <p className="text-xs text-gray-500 mt-0.5">
                      Stok: {product.stock}
                    </p>

                  </button>
                )
              )}

            </div>
          )}

        </div>

        {/* ====================================
            AI CROSS SELL
        ==================================== */}

        {recommendations.length > 0 && (
          <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-xl p-3">

            <div className="flex items-center gap-2 mb-2">

              <Bot className="w-4 h-4 text-indigo-400" />

              <p className="text-xs font-semibold text-indigo-300">
                AI Rekomendasi Tambahan
              </p>

            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">

              {recommendations
                .slice(0, 4)
                .map((recommendation) => (
                  <button
                    key={
                      recommendation.id
                    }
                    onClick={() =>
                      addToCart(
                        recommendation
                      )
                    }
                    className="flex-shrink-0 flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 hover:border-indigo-500 transition-colors"
                  >

                    <span className="text-xs text-white font-medium">
                      {recommendation.name
                        .split(' ')
                        .slice(0, 3)
                        .join(' ')}
                    </span>

                    <span className="text-xs text-indigo-300 font-semibold">
                      {formatRp(
                        recommendation.price
                      )}
                    </span>

                  </button>
                ))}

            </div>

          </div>
        )}

      </div>

      {/* ======================================
          RIGHT — CART
      ====================================== */}

      <div className="w-80 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col">

        {/* Cart Header */}

        <div className="px-4 py-4 border-b border-gray-800">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              <ShoppingCart className="w-4 h-4 text-indigo-400" />

              <h3 className="text-sm font-semibold text-white">
                Keranjang
              </h3>

            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />

                Kosongkan
              </button>
            )}

          </div>

        </div>

        {/* Cart Items */}

        <div className="flex-1 overflow-y-auto p-3 space-y-2">

          {cart.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-xs">
              Klik produk untuk menambahkan ke keranjang
            </div>
          )}

          {cart.map((item) => (
            <div
              key={item.id}
              className="bg-gray-800 rounded-xl p-3"
            >

              <div className="flex items-start justify-between gap-2 mb-2">

                <p className="text-xs font-semibold text-white line-clamp-2 flex-1">
                  {item.name}
                </p>

                <button
                  onClick={() =>
                    updateQty(
                      item.id,
                      0
                    )
                  }
                  className="text-gray-500 hover:text-red-400 flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

              </div>

              <div className="flex items-center justify-between">

                <p className="text-xs font-bold text-indigo-300">
                  {formatRp(
                    Number(item.price) *
                      item.qty
                  )}
                </p>

                <div className="flex items-center gap-2">

                  <button
                    onClick={() =>
                      updateQty(
                        item.id,
                        item.qty - 1
                      )
                    }
                    className="w-5 h-5 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="text-xs font-semibold text-white w-5 text-center">
                    {item.qty}
                  </span>

                  <button
                    onClick={() =>
                      updateQty(
                        item.id,
                        item.qty + 1
                      )
                    }
                    disabled={
                      item.qty >=
                      Number(item.stock)
                    }
                    className="w-5 h-5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 flex items-center justify-center text-white"
                  >
                    <Plus className="w-3 h-3" />
                  </button>

                </div>

              </div>

            </div>
          ))}

        </div>

        {/* ====================================
            CHECKOUT
        ==================================== */}

        <div className="p-4 border-t border-gray-800 space-y-3">

          {/* Payment Method */}

          <div>

            <div className="flex items-center gap-2 mb-2">

              <CreditCard className="w-3.5 h-3.5 text-gray-400" />

              <p className="text-xs text-gray-400">
                Metode Pembayaran
              </p>

            </div>

            <div className="grid grid-cols-4 gap-1.5">

              {[
                'cash',
                'qris',
                'transfer',
                'debit',
              ].map((method) => (
                <button
                  key={method}
                  onClick={() => {
                    setPaymentMethod(
                      method
                    );

                    setPaidAmount('');
                  }}
                  className={`text-xs py-1.5 rounded-lg font-medium capitalize transition-all ${
                    paymentMethod === method
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {method}
                </button>
              ))}

            </div>

          </div>

          {/* Totals */}

          <div className="space-y-1.5 text-xs">

            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>

              <span>
                {formatRp(total)}
              </span>
            </div>

            <div className="flex items-center gap-2">

              <span className="text-gray-400">
                Diskon
              </span>

              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) =>
                  setDiscount(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-indigo-500 text-right"
              />

            </div>

            <div className="flex justify-between font-bold text-sm text-white border-t border-gray-700 pt-1.5">

              <span>
                Total Bayar
              </span>

              <span className="text-green-400">
                {formatRp(
                  finalAmount
                )}
              </span>

            </div>

          </div>

          {/* Cash */}

          {paymentMethod === 'cash' && (
            <div>

              <input
                type="number"
                value={paidAmount}
                onChange={(e) =>
                  setPaidAmount(
                    e.target.value
                  )
                }
                placeholder="Jumlah uang diterima..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
              />

              {paid >= finalAmount &&
                finalAmount > 0 && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Kembalian:{' '}
                    {formatRp(
                      change
                    )}
                  </p>
                )}

            </div>
          )}

          {/* Non Cash Info */}

          {paymentMethod !== 'cash' &&
            finalAmount > 0 && (
              <div className="bg-indigo-900/20 border border-indigo-800/30 rounded-xl p-2.5">

                <p className="text-xs text-indigo-300">
                  Pembayaran{' '}
                  {paymentMethod.toUpperCase()}
                </p>

                <p className="text-sm font-bold text-white mt-0.5">
                  {formatRp(
                    finalAmount
                  )}
                </p>

              </div>
            )}

          {/* Checkout */}

          <button
            onClick={handleCheckout}
            disabled={
              processing ||
              cart.length === 0
            }
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
          >

            {processing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}

            {processing
              ? 'Memproses...'
              : 'Proses Pembayaran'}

          </button>

        </div>

      </div>

      {/* ======================================
          RECEIPT
      ====================================== */}

      <Modal
        open={receiptOpen}
        onClose={() =>
          setReceiptOpen(false)
        }
        title="🧾 Struk Pembayaran"
        size="sm"
      >

        {receipt && (
          <div className="space-y-4 text-sm">

            <div className="text-center border-b border-dashed border-gray-700 pb-4">

              <p className="font-bold text-white text-base">
                UMKM.AI Store
              </p>

              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(
                  receipt.created_at
                ).toLocaleString(
                  'id-ID'
                )}
              </p>

              <p className="font-mono text-xs text-indigo-300 mt-1">
                {receipt.invoice_no}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Kasir: {receipt.cashier_name || '-'}
              </p>

            </div>

            <div className="space-y-2 border-b border-dashed border-gray-700 pb-4">

              {receipt.items?.map(
                (item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-xs"
                  >

                    <span className="text-gray-300">
                      {item.product_name} ×
                      {item.quantity}
                    </span>

                    <span className="font-medium text-white">
                      {formatRp(
                        item.subtotal
                      )}
                    </span>

                  </div>
                )
              )}

            </div>

            <div className="space-y-1 text-xs">

              {Number(
                receipt.discount_amount
              ) > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>
                    Diskon
                  </span>

                  <span>
                    -{' '}
                    {formatRp(
                      receipt.discount_amount
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between font-bold text-base text-white">

                <span>
                  TOTAL
                </span>

                <span className="text-green-400">
                  {formatRp(
                    receipt.final_amount
                  )}
                </span>

              </div>

              <div className="flex justify-between text-gray-400">

                <span>
                  Bayar (
                  {receipt.payment_method}
                  )
                </span>

                <span>
                  {formatRp(
                    receipt.paid_amount
                  )}
                </span>

              </div>

              {Number(
                receipt.change_amount
              ) > 0 && (
                <div className="flex justify-between text-yellow-400 font-semibold">

                  <span>
                    Kembalian
                  </span>

                  <span>
                    {formatRp(
                      receipt.change_amount
                    )}
                  </span>

                </div>
              )}

            </div>

            <div className="text-center text-xs text-gray-500 pt-2">

              <p>
                Terima kasih sudah berbelanja!
              </p>

              <p className="text-indigo-400 mt-1">
                Powered by UMKM.AI 🤖
              </p>

            </div>

            <button
              onClick={() =>
                setReceiptOpen(false)
              }
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white"
            >
              Tutup & Lanjut
            </button>

          </div>
        )}

      </Modal>

    </div>
  );
}