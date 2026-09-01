import { useState, useEffect } from 'react';
import api from '../api';
import { BarChart3, RefreshCw, AlertTriangle, TrendingUp, CheckCircle, Lightbulb, ShieldAlert, Sparkles } from 'lucide-react';

const formatRp = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

export default function AIInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/insights');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return { label: 'Sangat Sehat', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
    if (score >= 60) return { label: 'Cukup Sehat', color: 'bg-yellow-950 text-yellow-300 border-yellow-800' };
    return { label: 'Perlu Perhatian', color: 'bg-rose-950 text-rose-300 border-rose-800' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            Business Health Insights AI
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Diagnostik menyeluruh performa finansial, margin, slow-moving inventory, dan rekomendasi strategis
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all w-fit shadow-lg shadow-indigo-600/20"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Analisis
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Menganalisis data transaksi & kesehatan bisnis...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Health Score Banner */}
          <div className="bg-gradient-to-r from-gray-900 via-indigo-950/40 to-gray-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Skor Kesehatan Bisnis</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getScoreBadge(data.healthScore).color}`}>
                    {getScoreBadge(data.healthScore).label}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">Ringkasan Finansial 30 Hari Terakhir</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{data.summaryText}</p>
              </div>

              <div className={`flex flex-col items-center justify-center p-5 rounded-2xl border ${getScoreColor(data.healthScore)} w-full md:w-36 flex-shrink-0`}>
                <span className="text-4xl font-extrabold">{data.healthScore}</span>
                <span className="text-xs text-gray-400 mt-1 uppercase font-semibold">dari 100</span>
              </div>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-1">
              <p className="text-xs text-gray-400 font-medium uppercase">Gross Margin Rata-rata</p>
              <p className="text-2xl font-bold text-white">{data.financials?.grossMarginPct || 0}%</p>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Margin kotor penjualan
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-1">
              <p className="text-xs text-gray-400 font-medium uppercase">Total Omset 30 Hari</p>
              <p className="text-2xl font-bold text-indigo-300">{formatRp(data.financials?.totalRevenue)}</p>
              <p className="text-xs text-gray-400">{data.financials?.totalOrders || 0} total transaksi</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-1">
              <p className="text-xs text-gray-400 font-medium uppercase">Total Laba Kotor</p>
              <p className="text-2xl font-bold text-emerald-400">{formatRp(data.financials?.grossProfit)}</p>
              <p className="text-xs text-gray-400">Estimasi profit bersih kotor</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-1">
              <p className="text-xs text-gray-400 font-medium uppercase">Slow-Moving Stock</p>
              <p className="text-2xl font-bold text-rose-400">{data.slowMovingProducts?.length || 0} Produk</p>
              <p className="text-xs text-gray-400">Kurang laku / perputaran lambat</p>
            </div>
          </div>

          {/* Actionable Recommendations & Tips */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Strategic Action Tips */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Rekomendasi Strategis AI</h3>
              </div>
              <div className="space-y-3">
                {data.actionableTips && data.actionableTips.length > 0 ? (
                  data.actionableTips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-gray-800/50 border border-gray-700/60 rounded-xl p-3.5">
                      <div className="w-6 h-6 rounded-lg bg-indigo-900/60 text-indigo-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{tip.title}</p>
                        <p className="text-xs text-gray-300 mt-1 leading-relaxed">{tip.detail}</p>
                        {tip.impact && (
                          <span className="inline-block mt-2 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                            🎯 Potensi Dampak: {tip.impact}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">Tidak ada tips khusus saat ini.</p>
                )}
              </div>
            </div>

            {/* Slow Moving Products Alert */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <h3 className="text-base font-bold text-white">Deteksi Produk Slow-Moving</h3>
                </div>
                <span className="text-xs text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2.5 py-1 rounded-full font-medium">
                  {data.slowMovingProducts?.length || 0} Perlu Tindakan
                </span>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {data.slowMovingProducts && data.slowMovingProducts.length > 0 ? (
                  data.slowMovingProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-gray-800/40 border border-gray-700/40 rounded-xl hover:border-gray-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url || 'https://placehold.co/40x40/1f2937/6366f1?text=P'}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover"
                          onError={(e) => { e.target.src = 'https://placehold.co/40x40/1f2937/6366f1?text=P'; }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-white">{p.name}</p>
                          <p className="text-xs text-gray-400">Sisa Stok: <span className="text-white font-medium">{p.stock}</span> · Terjual: <span className="text-white font-medium">{p.sold30d || 0} unit</span></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-rose-400 block">Diam di gudang</span>
                        <span className="text-[11px] text-gray-500">Nilai: {formatRp(p.stock * (p.cost_price || p.price))}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                    <p className="text-sm font-medium text-gray-300">Semua produk bergerak optimal</p>
                    <p className="text-xs mt-0.5">Tidak ada stok mengendap lebih dari 30 hari.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-gray-900 border border-gray-800 rounded-2xl text-gray-400">
          Gagal memuat wawasan AI. Silakan coba lagi.
        </div>
      )}
    </div>
  );
}
