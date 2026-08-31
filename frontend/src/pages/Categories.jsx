import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ICONS = ['Coffee', 'Utensils', 'Package', 'ShoppingBag', 'Folder', 'Star', 'Heart', 'Zap', 'Tag', 'Gift'];

export default function Categories() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', icon: 'Folder' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = () => api.get('/categories').then(r => setCategories(r.data)).catch(console.error);
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditItem(null); setForm({ name: '', description: '', icon: 'Folder' }); setError(''); setModalOpen(true); };
  const openEdit = (c) => { setEditItem(c); setForm({ name: c.name, description: c.description || '', icon: c.icon || 'Folder' }); setError(''); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editItem) await api.put(`/categories/${editItem.id}`, form);
      else await api.post('/categories', form);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Hapus kategori "${c.name}"?`)) return;
    try { await api.delete(`/categories/${c.id}`); fetchData(); } catch (err) { alert(err.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Tambah Kategori
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(c => (
          <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4 hover:border-indigo-700/50 transition-colors">
            <div className="w-12 h-12 bg-indigo-900/30 border border-indigo-700/30 rounded-xl flex items-center justify-center text-indigo-400">
              <Tag className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">{c.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{c.description || 'Tidak ada deskripsi'}</p>
            </div>
            {isAdmin && (
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-indigo-900/30"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/30"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">Belum ada kategori produk.</div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Kategori' : 'Tambah Kategori'}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nama Kategori *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Deskripsi</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-gray-700 rounded-xl text-sm text-gray-300 hover:bg-gray-800">Batal</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
