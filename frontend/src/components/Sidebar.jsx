import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Tag, Users,
  FileText, TrendingUp, Lightbulb, BarChart3, MessageSquare,
  Bot, X, Brain,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navGroups = [
  {
    label: 'Operasional',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/pos', icon: ShoppingCart, label: 'Kasir POS' },
      { to: '/transactions', icon: FileText, label: 'Transaksi' },
    ],
  },
  {
    label: 'Master Data',
    items: [
      { to: '/products', icon: Package, label: 'Produk' },
      { to: '/categories', icon: Tag, label: 'Kategori' },
      { to: '/customers', icon: Users, label: 'Pelanggan' },
    ],
  },
  {
    label: 'AI Engine',
    items: [
      {
        to: '/ai/prediction',
        icon: TrendingUp,
        label: 'Prediksi Permintaan',
      },
      {
        to: '/ai/recommendation',
        icon: Lightbulb,
        label: 'Rekomendasi Produk',
      },
      {
        to: '/ai/insights',
        icon: BarChart3,
        label: 'Business Insights',
      },
      {
        to: '/ai/chat',
        icon: MessageSquare,
        label: 'Asisten AI',
      },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 bg-gray-900 border-r border-gray-800 flex flex-col
          transform transition-transform duration-300
          ${open
            ? 'translate-x-0'
            : '-translate-x-full md:translate-x-0'
          }
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>

            <div>
              <div className="font-bold text-white text-base leading-tight">
                UMKM.AI
              </div>
              <div className="text-xs text-indigo-400">
                Platform Bisnis Cerdas
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => {
              if (!user) return false;

              // AI Analytics hanya dapat diakses Owner
              if (
                [
                  '/ai/prediction',
                  '/ai/recommendation',
                  '/ai/insights',
                ].includes(item.to)
              ) {
                return user.role === 'owner';
              }

              return true;
            });

            if (visibleItems.length === 0) {
              return null;
            }

            return (
              <div key={group.label}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                  {group.label}
                </p>

                <ul className="space-y-1">
                  {visibleItems.map(
                    ({ to, icon: Icon, label }) => (
                      <li key={to}>
                        <NavLink
                          to={to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                            ${
                              isActive
                                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`
                          }
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {label}
                        </NavLink>
                      </li>
                    )
                  )}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* AI Badge */}
        <div className="px-4 py-4 border-t border-gray-800">
          <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-700/40 rounded-xl p-3">
            <Bot className="w-4 h-4 text-indigo-400" />

            <div>
              <p className="text-xs font-semibold text-indigo-300">
                AI Engine Aktif
              </p>
              <p className="text-xs text-gray-500">
                Analitik Real-time
              </p>
            </div>

            <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
        </div>
      </aside>
    </>
  );
}