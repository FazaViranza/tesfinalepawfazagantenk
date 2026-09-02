import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import StatCard from '../components/StatCard';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowRight,
  Brain,
  Zap,
} from 'lucide-react';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const formatRp = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v || 0);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => {
        const dashboardData = res?.data?.data || res?.data;
        setData(dashboardData || null);
      })
      .catch((err) => {
        console.error(err);
        setError(err?.message || 'Gagal memuat data dashboard.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-4 text-sm text-red-300">
        {error || 'Gagal memuat data dashboard.'}
      </div>
    );
  }

  const {
    summary = {},
    weekChart = [],
    topProducts = [],
    recentTransactions = [],
    aiInsights = [],
  } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pendapatan Hari Ini"
          value={formatRp(summary.todayRevenue)}
          subtitle={`${summary.todayOrders || 0} transaksi`}
          icon={TrendingUp}
          color="indigo"
        />

        <StatCard
          title="Omset Bulan Ini"
          value={formatRp(summary.thisMonthRevenue)}
          icon={ShoppingCart}
          color="green"
          trend={summary.revenueGrowthPct}
        />

        <StatCard
          title="Total Produk"
          value={summary.totalProducts || 0}
          subtitle={
            summary.lowStockCount > 0
              ? `${summary.lowStockCount} stok rendah`
              : 'Semua stok aman'
          }
          icon={Package}
          color={summary.lowStockCount > 0 ? 'yellow' : 'blue'}
        />

        <StatCard
          title="Stok Menipis"
          value={summary.lowStockCount || 0}
          subtitle={
            summary.lowStockCount > 0
              ? 'Perlu segera diperiksa'
              : 'Tidak ada stok kritis'
          }
          icon={AlertTriangle}
          color={summary.lowStockCount > 0 ? 'yellow' : 'blue'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            📈 Grafik Penjualan 7 Hari Terakhir
          </h3>

          {weekChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weekChart}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />

                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />

                <YAxis
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />

                <Tooltip
                  formatter={(v) => [formatRp(v), 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    fontSize: 12,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-500 text-sm">
              Belum ada data transaksi minggu ini
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">AI Insights</h3>
            <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>

          <div className="space-y-3">
            {aiInsights.length === 0 && (
              <p className="text-gray-500 text-xs">
                Tidak ada notifikasi baru.
              </p>
            )}

            {aiInsights.map((insight) => (
              <div
                key={insight.id}
                className="bg-gray-800/60 border border-gray-700 rounded-xl p-3"
              >
                <p className="text-xs font-semibold text-indigo-300 mb-1">
                  {insight.title}
                </p>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {insight.summary}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">
                    Skor:{' '}
                    <span className="text-green-400 font-semibold">
                      {insight.score}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/ai/insights"
            className="flex items-center justify-center gap-1 mt-4 text-xs text-indigo-400 hover:text-indigo-300"
          >
            Lihat Semua Insights
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              🏆 Produk Terlaris Bulan Ini
            </h3>
            <Link
              to="/products"
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-6 text-xs font-bold text-gray-500">
                  #{idx + 1}
                </span>

                <img
                  src={
                    p.image_url ||
                    'https://placehold.co/40x40/1f2937/6366f1?text=P'
                  }
                  alt={p.name}
                  className="w-9 h-9 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://placehold.co/40x40/1f2937/6366f1?text=P';
                  }}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {p.category_name || '-'}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-indigo-300">
                    {p.total_sold} terjual
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatRp(p.total_revenue)}
                  </p>
                </div>
              </div>
            ))}

            {topProducts.length === 0 && (
              <p className="text-xs text-gray-500">Belum ada penjualan.</p>
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              🧾 Transaksi Terbaru
            </h3>
            <Link
              to="/transactions"
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0"
              >
                <div className="w-8 h-8 bg-indigo-900/40 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-indigo-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">
                    {tx.invoice_no}
                  </p>
                  <p className="text-xs text-gray-400">
                    {tx.cashier_name || 'Kasir'}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-green-400">
                    {formatRp(tx.final_amount)}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {tx.payment_method}
                  </p>
                </div>
              </div>
            ))}

            {recentTransactions.length === 0 && (
              <p className="text-xs text-gray-500">
                Belum ada transaksi.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-700/30 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">Aksi Cepat</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: 'Prediksi Permintaan',
              to: '/ai/prediction',
              color: 'from-purple-600 to-purple-700',
            },
            {
              label: 'Rekomendasi Produk',
              to: '/ai/recommendation',
              color: 'from-pink-600 to-pink-700',
            },
          ].map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className={`bg-gradient-to-br ${a.color} text-white text-xs font-semibold text-center py-3 px-2 rounded-xl hover:opacity-90 transition-opacity`}
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
