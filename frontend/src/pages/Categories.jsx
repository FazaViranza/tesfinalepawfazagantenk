import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { validateText } from '../utils/validation';

export default function Categories() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    icon: 'Folder',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = () => {
    api
      .get('/categories')
      .then((r) => setCategories(r.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditItem(null);

    setForm({
      name: '',
      description: '',
      icon: 'Folder',
    });

    setError('');
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setEditItem(category);

    setForm({
      name: category.name || '',
      description: category.description || '',
      icon: category.icon || 'Folder',
    });

    setError('');
    setModalOpen(true);
  };

  const validateForm = () => {
    const nameError = validateText(form.name, 'Nama kategori', 100);

    if (nameError) {
      return nameError;
    }

    if (form.description && form.description.trim().length > 500) {
      return 'Deskripsi maksimal 500 karakter.';
    }

    if (form.icon && form.icon.trim().length > 50) {
      return 'Icon maksimal 50 karakter.';
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
      name: form.name.trim(),
      description: form.description.trim() || null,
      icon: form.icon.trim() || 'Folder',
    };

    try {
      if (editItem) {
        await api.put(`/categories/${editItem.id}`, payload);
      } else {
        await api.post('/categories', payload);
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Gagal menyimpan kategori.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!confirm(`Hapus kategori "${category.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/categories/${category.id}`);
      fetchData();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        err.message ||
        'Gagal menghapus kategori.'
      );
    }
  };

  return (
    <div className="space-y-5">

      {/* Header / Add Button */}
      <div className="flex justify-end">
        {isOwner && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori
          </button>
        )}
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4 hover:border-indigo-700/50 transition-colors"
          >

            {/* Icon */}
            <div className="w-12 h-12 bg-indigo-900/30 border border-indigo-700/30 rounded-xl flex items-center justify-center text-indigo-400">
              <Tag className="w-6 h-6" />
            </div>

            {/* Category Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">
                {category.name}
              </p>

              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {category.description || 'Tidak ada deskripsi'}
              </p>
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="flex gap-1.5">

                <button
                  onClick={() => openEdit(category)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-indigo-900/30"
                  title="Edit kategori"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(category)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/30"
                  title="Hapus kategori"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

              </div>
            )}

          </div>
        ))}

        {categories.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            Belum ada kategori produk.
          </div>
        )}

      </div>

      {/* Category Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Kategori' : 'Tambah Kategori'}
      >

        <form
          onSubmit={handleSave}
          className="space-y-4"
        >

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>

            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nama Kategori *
            </label>

            <input
              required
              maxLength={100}
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  name: e.target.value,
                }))
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            />

          </div>

          {/* Description */}
          <div>

            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Deskripsi
            </label>

            <textarea
              rows={2}
              maxLength={500}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  description: e.target.value,
                }))
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />

          </div>

          {/* Buttons */}
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