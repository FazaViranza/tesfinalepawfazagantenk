import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import {
  validateText,
  validatePrice,
  validateInteger,
  validateUrl,
} from '../utils/validation';

const formatRp = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v || 0);

const emptyForm = {
  category_id: '',
  name: '',
  sku: '',
  price: '',
  cost_price: '',
  stock: '',
  min_stock: 5,
  unit: 'pcs',
  image_url: '',
  description: '',
};

export default function Products() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);

    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products', search ? { search } : {}),
        api.get('/categories'),
      ]);

      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditItem(p);

    setForm({
      category_id: p.category_id || '',
      name: p.name || '',
      sku: p.sku || '',
      price: p.price ?? '',
      cost_price: p.cost_price ?? '',
      stock: p.stock ?? '',
      min_stock: p.min_stock ?? 5,
      unit: p.unit || 'pcs',
      image_url: p.image_url || '',
      description: p.description || '',
    });

    setError('');
    setModalOpen(true);
  };

  const validateForm = () => {
    const nameError = validateText(form.name, 'Nama Produk', 150);
    if (nameError) return nameError;

    const priceError = validatePrice(form.price, 'Harga jual');
    if (priceError) return priceError;

    if (form.cost_price !== '') {
      const costError = validatePrice(form.cost_price, 'Harga modal / HPP');
      if (costError) return costError;
    }

    if (form.stock !== '') {
      const stockError = validateInteger(form.stock, 'Stok');
      if (stockError) return stockError;
    }

    if (form.min_stock !== '') {
      const minStockError = validateInteger(form.min_stock, 'Minimum stok');
      if (minStockError) return minStockError;
    }

    if (form.sku && form.sku.trim().length > 50) {
      return 'SKU maksimal 50 karakter.';
    }

    if (form.description && form.description.trim().length > 1000) {
      return 'Deskripsi maksimal 1000 karakter.';
    }

    const imageError = validateUrl(form.image_url);
    if (imageError) return imageError;

    if (!form.unit || !form.unit.trim()) {
      return 'Satuan wajib dipilih.';
    }

    return '';
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      category_id: form.category_id || null,
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      price: Number(form.price),
      cost_price: form.cost_price === '' ? 0 : Number(form.cost_price),
      stock: form.stock === '' ? 0 : Number(form.stock),
      min_stock: form.min_stock === '' ? 5 : Number(form.min_stock),
      unit: form.unit.trim(),
      image_url: form.image_url.trim() || null,
      description: form.description.trim() || null,
    };

    try {
      if (editItem) {
        await api.put(`/products/${editItem.id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Gagal menyimpan produk.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Yakin menghapus produk "${p.name}"?`)) return;

    try {
      await api.delete(`/products/${p.id}`);
      fetchData();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        err.message ||
        'Gagal menghapus produk.'
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk atau SKU..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {isOwner && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
        )}
      </div>

      {/* Product Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Produk
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Kategori
                </th>

                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Harga Jual
                </th>

                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  HPP (Modal)
                </th>

                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Stok
                </th>

                {isOwner && (
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              )}

              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              )}

              {!loading &&
                products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            p.image_url ||
                            'https://placehold.co/40x40/1f2937/6366f1?text=P'
                          }
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover"
                          onError={(e) => {
                            e.target.src =
                              'https://placehold.co/40x40/1f2937/6366f1?text=P';
                          }}
                        />

                        <div>
                          <p className="font-medium text-white">{p.name}</p>

                          <p className="text-xs text-gray-500">
                            {p.sku || '-'} • {p.unit}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-gray-300">
                      {p.category_name || '-'}
                    </td>

                    <td className="px-5 py-3.5 text-right font-semibold text-indigo-300">
                      {formatRp(p.price)}
                    </td>

                    <td className="px-5 py-3.5 text-right text-gray-400">
                      {formatRp(p.cost_price)}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full
                        ${
                          p.stock <= p.min_stock
                            ? 'bg-red-900/40 text-red-300 border border-red-700/50'
                            : 'bg-green-900/40 text-green-300 border border-green-700/50'
                        }`}
                      >
                        {p.stock <= p.min_stock && (
                          <AlertCircle className="w-3 h-3" />
                        )}

                        {p.stock} {p.unit}
                      </span>
                    </td>

                    {isOwner && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-indigo-900/30"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Produk' : 'Tambah Produk Baru'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Nama */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Nama Produk *
              </label>

              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Kategori
              </label>

              <select
                value={form.category_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category_id: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Pilih Kategori --</option>

                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                SKU
              </label>

              <input
                value={form.sku}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sku: e.target.value }))
                }
                placeholder="DRK-001"
                maxLength={50}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Harga Jual (Rp) *
              </label>

              <input
                type="number"
                required
                min="0"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Harga Modal / HPP (Rp)
              </label>

              <input
                type="number"
                min="0"
                value={form.cost_price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cost_price: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Stok Tersedia
              </label>

              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stock: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Min Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Min. Stok (Alert AI)
              </label>

              <input
                type="number"
                min="0"
                value={form.min_stock}
                onChange={(e) =>
                  setForm((f) => ({ ...f, min_stock: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Satuan
              </label>

              <select
                value={form.unit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unit: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {['pcs', 'cup', 'porsi', 'pack', 'kg', 'liter', 'botol'].map(
                  (u) => (
                    <option key={u}>{u}</option>
                  )
                )}
              </select>
            </div>

            {/* Image URL */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                URL Foto Produk
              </label>

              <input
                value={form.image_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, image_url: e.target.value }))
                }
                placeholder="https://..."
                maxLength={500}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Deskripsi
              </label>

              <textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                maxLength={1000}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 border border-gray-700 rounded-xl text-sm text-gray-300 hover:bg-gray-800"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}