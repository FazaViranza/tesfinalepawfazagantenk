import { useState, useEffect } from 'react';
import api from '../api';
import { Lightbulb, RefreshCw, Tag, TrendingUp } from 'lucide-react';

const formatRp = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

export default function AIRecommendation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/recommendations');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Rekomendasi Produk & Analisis Keranjang Belanja
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Market Basket Analysis & Association Rule Mining dari data transaksi historis</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-indigo-300">{data.totalTransactions}</p>
              <p className="text-xs text-gray-400 mt-1">Total Transaksi Dianalisis</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{data.totalAnalyzedBaskets}</p>
              <p className="text-xs text-gray-400 mt-1">Multi-Item Basket</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{data.topAssociations.length}</p>
              <p className="text-xs text-gray-400 mt-1">Aturan Asosiasi Ditemukan</p>
            </div>
          </div>

          {/* Association Rules */}
          {data.topAssociations.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center text-gray-500">
              Belum cukup data transaksi multi-item untuk analisis. Lakukan lebih banyak transaksi dengan 2+ produk sekaligus.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.topAssociations.map((rule, idx) => (
                <div key={rule.pairId} className="bg-gray-900 border border-gray-800 hover:border-indigo-700/50 rounded-2xl p-5 transition-colors">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-indigo-400 bg-indigo-900/40 border border-indigo-700/40 px-2.5 py-1 rounded-full">
                      #{idx + 1} · Confidence {rule.confidencePct}%
                    </span>
                    <span className="text-xs text-gray-500">Support {rule.supportPct}% · Lift {rule.lift}x</span>
                  </div>

                  {/* Product Pair */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 bg-gray-800 rounded-xl p-3 text-center">
                      <img src={rule.productA.imageUrl || 'https://placehold.co/60x60/1f2937/6366f1?text=A'}
                        alt={rule.productA.name} className="w-12 h-12 object-cover rounded-lg mx-auto mb-1.5"
                        onError={e => { e.target.src = 'https://placehold.co/60x60/1f2937/6366f1?text=A'; }} />
                      <p className="text-xs font-semibold text-white line-clamp-2">{rule.productA.name}</p>
                      <p className="text-xs text-indigo-400 font-bold mt-0.5">{formatRp(rule.productA.price)}</p>
                    </div>

                    <div className="text-2xl text-gray-500 font-light">+</div>

                    <div className="flex-1 bg-gray-800 rounded-xl p-3 text-center">
                      <img src={rule.productB.imageUrl || 'https://placehold.co/60x60/1f2937/6366f1?text=B'}
                        alt={rule.productB.name} className="w-12 h-12 object-cover rounded-lg mx-auto mb-1.5"
                        onError={e => { e.target.src = 'https://placehold.co/60x60/1f2937/6366f1?text=B'; }} />
                      <p className="text-xs font-semibold text-white line-clamp-2">{rule.productB.name}</p>
                      <p className="text-xs text-indigo-400 font-bold mt-0.5">{formatRp(rule.productB.price)}</p>
                    </div>
                  </div>

                  {/* Bundle Suggestion */}
                  <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-700/30 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Tag className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-xs font-bold text-yellow-300">Saran Bundling: {rule.bundleSuggestion.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <p className="text-gray-400">Harga Normal: <span className="line-through">{formatRp(rule.bundleSuggestion.normalPrice)}</span></p>
                        <p className="text-green-400 font-bold">Harga Bundle: {formatRp(rule.bundleSuggestion.bundlePrice)}</p>
                        <p className="text-yellow-300">Hemat: {formatRp(rule.bundleSuggestion.savings)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400">Margin</p>
                        <p className={`text-lg font-bold ${rule.bundleSuggestion.marginPct >= 40 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {rule.bundleSuggestion.marginPct}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : <p className="text-gray-400 text-sm">Gagal memuat rekomendasi.</p>}
    </div>
  );
}
