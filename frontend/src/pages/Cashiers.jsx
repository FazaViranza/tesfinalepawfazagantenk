import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Modal from '../components/Modal';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  UserRound,
  Phone,
  Mail,
  X,
} from 'lucide-react';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
};

const formatDate = (date) => {
  if (!date) return '-';

  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function Cashiers() {
  const { user } = useAuth();

  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCashier, setEditingCashier] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cashierToDelete, setCashierToDelete] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCashiers = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await api.get('/users');
      setCashiers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.message || 'Gagal memuat data kasir.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'owner') {
      loadCashiers();
    } else {
      setLoading(false);
    }
  }, [user]);

  const filteredCashiers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return cashiers;

    return cashiers.filter((cashier) => {
      return (
        cashier.name?.toLowerCase().includes(keyword) ||
        cashier.email?.toLowerCase().includes(keyword) ||
        cashier.phone?.toLowerCase().includes(keyword)
      );
    });
  }, [cashiers, search]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingCashier(null);
    setForm({ ...emptyForm });
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const openEditModal = (cashier) => {
    setEditingCashier(cashier);
    setForm({
      name: cashier.name || '',
      email: cashier.email || '',
      phone: cashier.phone || '',
      password: '',
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;

    setModalOpen(false);
    setEditingCashier(null);
    setForm({ ...emptyForm });
    setError('');
  };

  const validateForm = () => {
    const nameRegex = /^[A-Za-zÀ-ÿ\s]+$/;
    const phoneRegex = /^\d+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!name || !email || !phone) {
      return 'Nama, email, dan nomor HP wajib diisi.';
    }

    if (!nameRegex.test(name)) {
      return 'Nama hanya boleh berisi huruf dan spasi.';
    }

    if (!emailRegex.test(email)) {
      return 'Format email tidak valid.';
    }

    if (!phoneRegex.test(phone)) {
      return 'Nomor HP hanya boleh berisi angka.';
    }

    if (!editingCashier && !form.password) {
      return 'Password wajib diisi saat membuat akun.';
    }

    if (form.password && form.password.length < 6) {
      return 'Password minimal 6 karakter.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      if (editingCashier) {
        const res = await api.put(
          `/users/${editingCashier.id}`,
          payload
        );
        const updatedCashier = res.data;

        setSuccess('Akun kasir berhasil diperbarui.');
        setCashiers((prev) =>
          prev.map((cashier) =>
            cashier.id === editingCashier.id
              ? updatedCashier
              : cashier
          )
        );
      } else {
        const res = await api.post('/users', {
          ...payload,
          password: form.password,
        });
        const createdCashier = res.data;

        setSuccess('Akun kasir berhasil dibuat.');
        setCashiers((prev) => [createdCashier, ...prev]);
      }

      setModalOpen(false);
      setEditingCashier(null);
      setForm({ ...emptyForm });
    } catch (err) {
      setError(err.message || 'Gagal menyimpan akun kasir.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (cashier) => {
    setCashierToDelete(cashier);
    setError('');
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (submitting) return;

    setDeleteModalOpen(false);
    setCashierToDelete(null);
    setError('');
  };

  const handleDelete = async () => {
    if (!cashierToDelete) return;

    try {
      setSubmitting(true);
      setError('');

      await api.delete(`/users/${cashierToDelete.id}`);

      setSuccess(
        `Akun ${cashierToDelete.name} berhasil dihapus.`
      );

      setCashiers((prev) =>
        prev.filter((cashier) => cashier.id !== cashierToDelete.id)
      );

      setDeleteModalOpen(false);
      setCashierToDelete(null);
    } catch (err) {
      setError(err.message || 'Gagal menghapus akun kasir.');
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== 'owner') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-900/30 flex items-center justify-center">
            <X className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Akses Ditolak
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Halaman ini hanya dapat diakses oleh Owner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Manajemen Kasir
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Kelola akun kasir yang dapat mengakses sistem.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Kasir
        </button>
      </div>

      {success && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-green-800 bg-green-900/20 text-green-300 text-sm">
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess('')}
            className="text-green-400 hover:text-green-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && !modalOpen && !deleteModalOpen && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-red-800 bg-red-900/20 text-red-300 text-sm">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau nomor HP..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Memuat data kasir...
          </div>
        ) : filteredCashiers.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-800 flex items-center justify-center">
              <UserRound className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-300">
              {search
                ? 'Kasir tidak ditemukan.'
                : 'Belum ada akun kasir.'}
            </p>
            {!search && (
              <p className="text-xs text-gray-500 mt-1">
                Klik "Tambah Kasir" untuk membuat akun baru.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-5 py-4 font-medium text-gray-400">Kasir</th>
                  <th className="px-5 py-4 font-medium text-gray-400">Kontak</th>
                  <th className="px-5 py-4 font-medium text-gray-400">Role</th>
                  <th className="px-5 py-4 font-medium text-gray-400">Dibuat</th>
                  <th className="px-5 py-4 font-medium text-gray-400 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCashiers.map((cashier) => (
                  <tr
                    key={cashier.id}
                    className="border-b border-gray-800 last:border-b-0 hover:bg-gray-800/40 transition"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                          {cashier.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-white">{cashier.name}</p>
                          <p className="text-xs text-gray-500">ID #{cashier.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Mail className="w-3.5 h-3.5 text-gray-500" />
                          <span>{cashier.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                          <Phone className="w-3.5 h-3.5 text-gray-500" />
                          <span>{cashier.phone || '-'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-800">
                        Kasir
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-400">
                      {formatDate(cashier.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(cashier)}
                          className="p-2 rounded-lg text-gray-400 hover:text-indigo-300 hover:bg-indigo-900/20 transition"
                          title="Edit kasir"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(cashier)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-300 hover:bg-red-900/20 transition"
                          title="Hapus kasir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && (
        <p className="text-xs text-gray-500">
          Menampilkan {filteredCashiers.length} dari {cashiers.length} akun kasir.
        </p>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingCashier ? 'Edit Akun Kasir' : 'Tambah Akun Kasir'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg border border-red-800 bg-red-900/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nama
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Contoh: Siti Aminah"
              maxLength={100}
              className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Hanya huruf dan spasi.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="kasir@email.com"
              maxLength={150}
              className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nomor HP
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="081234567890"
              maxLength={30}
              inputMode="numeric"
              className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Hanya angka.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Password
              {editingCashier && (
                <span className="text-gray-500 font-normal">
                  {' '}(kosongkan jika tidak ingin mengubah)
                </span>
              )}
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={editingCashier ? 'Password baru' : 'Minimal 6 karakter'}
              minLength={6}
              maxLength={100}
              className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-blue-900/10 border border-blue-800/40">
            <p className="text-xs text-blue-300">
              <span className="font-semibold">Role:</span>{' '}
              Kasir
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Akun yang dibuat melalui halaman ini otomatis memiliki role Kasir.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={submitting}
              className="px-4 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition disabled:opacity-50"
            >
              {submitting
                ? 'Menyimpan...'
                : editingCashier
                  ? 'Simpan Perubahan'
                  : 'Buat Akun'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        title="Hapus Akun Kasir"
      >
        <div className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg border border-red-800 bg-red-900/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <p className="text-sm text-gray-300">
              Apakah Anda yakin ingin menghapus akun:
            </p>
            <p className="text-base font-semibold text-white mt-2">
              {cashierToDelete?.name}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {cashierToDelete?.email}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-red-900/10 border border-red-800/40">
            <p className="text-xs text-red-300">
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeDeleteModal}
              disabled={submitting}
              className="px-4 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition disabled:opacity-50"
            >
              {submitting ? 'Menghapus...' : 'Hapus Akun'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
