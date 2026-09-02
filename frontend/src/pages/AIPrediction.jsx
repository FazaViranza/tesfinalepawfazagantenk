import { useState, useEffect } from 'react';
import api from '../api';
import { TrendingUp, AlertTriangle, RefreshCw, Package } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const formatRp = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

const riskColors = {
  Habis: 'bg-red-900/40 text-red-300 border-red-700/50',
  Kritis: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
  Perhatian: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  Aman: 'bg-green-900/40 text-green-300 border-green-700/50',
};

export default function AIPrediction() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/ai/prediction', { days });
      setData(res.data);
    } catch (e) {
      setData(null);
      setError(e.message || 'Gagal memuat data prediksi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  const chartData = data ? [
    ...data.historicalData.map((d) => ({
      date: d.date.slice(5),
      historical: d.revenue,
    })),
    ...data.forecastData.map((d) => ({
      date: d.date.slice(5),
      forecast: d.predictedRevenue,
    })),
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Prediksi Permintaan & Rekomendasi Restock
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Proyeksi permintaan berbasis data transaksi historis
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value={7}>7 Hari</option>
            <option value={14}>14 Hari</option>
            <option value={30}>30 Hari</option>
          </select>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <>
          {!data.summary.hasHistoricalSales && (
            <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-xl p-4 text-sm text-yellow-300">
              Belum ada transaksi selesai dalam periode historis. Prediksi revenue dibuat 0 sampai sistem memiliki data penjualan.
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Proyeksi Revenue', value: formatRp(data.summary.predictedTotalRevenue), sub: `${data.summary.forecastDays} hari ke depan`, color: 'indigo' },
              { label: 'Rata-rata Harian', value: formatRp(data.summary.avgDailyRevenue), sub: 'Berdasarkan data historis', color: 'green' },
              { label: 'Tren Pertumbuhan', value: `${data.summary.growthTrendPct > 0 ? '+' : ''}${data.summary.growthTrendPct}%`, sub: 'Slope trend harian', color: data.summary.growthTrendPct >= 0 ? 'green' : 'red' },
              { label: 'Produk Stok Kritis', value: data.summary.criticalStockCount, sub: 'Perlu restock segera', color: data.summary.criticalStockCount > 0 ? 'red' : 'green' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</p>
                <p className={`text-xl font-bold mt-1 ${s.color === 'red' ? 'text-red-400' : s.color === 'green' ? 'text-green-400' : 'text-indigo-300'}`}>
                  {s.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">📈 Grafik Historis & Proyeksi Penjualan</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip
                  formatter={(v, name) => [formatRp(v), name]}
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="historical" stroke="#6366f1" strokeWidth={2} dot={false} name="Historis" />
                <Line type="monotone" dataKey="forecast" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Proyeksi AI" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-400" />
                Analisis Per-Produk & Rekomendasi Restock
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Produk</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Stok</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Terjual/30hr</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Kecepatan/hari</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Estimasi Habis</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Risiko</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Restock</th>
                  </tr>
                </thead>
                <tbody>
                  {data.productForecasts.map((p) => (
                    <tr key={p.productId} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-white">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.category || '-'} · {p.sku || '-'}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center text-white font-semibold">{p.currentStock}</td>
                      <td className="px-4 py-3.5 text-center text-gray-300">{p.unitsSold30d}</td>
                      <td className="px-4 py-3.5 text-center text-gray-300">{p.dailyVelocity}/hari</td>
                      <td className="px-4 py-3.5 text-center text-gray-300 text-xs">{p.daysUntilStockout}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${riskColors[p.riskLevel] || riskColors.Aman}`}>
                          {p.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {p.recommendedRestock > 0 ? (
                          <div>
                            <span className="flex items-center justify-center gap-1 text-orange-300 font-bold text-sm">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              +{p.recommendedRestock}
                            </span>
                            <p className="text-xs text-gray-500">{formatRp(p.estimatedRestockCost)}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-400 text-sm">Tidak ada data prediksi.</p>
      )}
    </div>
  );
}
