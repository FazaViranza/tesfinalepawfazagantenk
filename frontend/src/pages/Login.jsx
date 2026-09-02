import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const res = await login(
        form.email.trim(),
        form.password
      );

      const loggedInUser = res.data.user;

      if (loggedInUser.role === 'owner') {
        navigate('/dashboard', { replace: true });
      } else if (loggedInUser.role === 'cashier') {
        navigate('/pos', { replace: true });
      } else {
        setError('Role pengguna tidak dikenali.');
      }
    } catch (err) {
      setError(
        err.message ||
        'Login gagal. Periksa email dan password Anda.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">

      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      </div>

      <div className="relative w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">

          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
            <Brain className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-white">
            UMKM.AI
          </h1>

          <p className="text-gray-400 text-sm mt-1">
            Platform Manajemen Bisnis UMKM Berbasis AI
          </p>

        </div>

        {/* Login Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">

          <h2 className="text-xl font-semibold text-white mb-1">
            Masuk ke Akun
          </h2>

          <p className="text-gray-400 text-sm mb-6">
            Gunakan email dan password yang telah diberikan oleh Owner.
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* Email */}
            <div>

              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>

              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="owner@umkm-ai.id"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              />

            </div>

            {/* Password */}
            <div>

              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>

              <div className="relative">

                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPass((prev) => !prev)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  aria-label={
                    showPass
                      ? 'Sembunyikan password'
                      : 'Tampilkan password'
                  }
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>

              </div>

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
            >

              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}

              {loading
                ? 'Memproses...'
                : 'Masuk'}

            </button>

          </form>

          {/* Demo credentials */}
          <div className="mt-5 p-3 bg-gray-800 rounded-xl border border-gray-700">

            <p className="text-xs font-semibold text-gray-400 mb-2">
              🔑 Akun Demo:
            </p>

            <div className="space-y-1 text-xs text-gray-300">

              <p>
                Owner:{' '}
                <span className="text-indigo-300">
                  owner@umkm-ai.id
                </span>{' '}
                /{' '}
                <span className="text-indigo-300">
                  admin123
                </span>
              </p>

              <p>
                Kasir:{' '}
                <span className="text-indigo-300">
                  kasir@umkm-ai.id
                </span>{' '}
                /{' '}
                <span className="text-indigo-300">
                  admin123
                </span>
              </p>

            </div>

          </div>

          {/* Account info */}
          <div className="mt-5 text-center">
            <p className="text-xs text-gray-500">
              Akun kasir dibuat dan dikelola oleh Owner.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}