import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/pos': 'Kasir POS',
  '/products': 'Manajemen Produk',
  '/categories': 'Manajemen Kategori',
  '/transactions': 'Riwayat Transaksi',
  '/ai/prediction': 'Prediksi Permintaan AI',
  '/ai/recommendation': 'Rekomendasi Produk AI',
  '/ai/insights': 'Business Health Insights AI',
};

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const title = pageTitles[pathname] || 'UMKM.AI';

  const roleLabel = {
    owner: 'Owner',
    cashier: 'Kasir',
  };

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 md:px-6 flex-shrink-0">

      {/* Left */}
      <div className="flex items-center gap-3">

        <button
          onClick={onMenuClick}
          className="md:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-base font-semibold text-white">
          {title}
        </h1>

      </div>

      {/* Right */}
      <div className="flex items-center gap-3">

        <div className="hidden sm:flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5">

          <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>

          <div>
            <p className="text-xs font-medium text-white leading-tight">
              {user?.name || 'User'}
            </p>

            <p className="text-xs text-gray-400 leading-tight">
              {roleLabel[user?.role] || user?.role || 'User'}
            </p>
          </div>

        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-all border border-gray-700 hover:border-red-700/50"
        >
          <LogOut className="w-4 h-4" />

          <span className="hidden sm:inline">
            Keluar
          </span>
        </button>

      </div>

    </header>
  );
}