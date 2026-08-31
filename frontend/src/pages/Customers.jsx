import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Trash2, Star, Phone, Mail } from 'lucide-react';

const formatRp = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

const tierColors = {
  Platinum: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
  Gold: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  Silver: 'bg-gray-700/40 text-gray-300 border-gray-600/50',
  Regular: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
};

const emptyForm = { name: '', email: '', phone: '', address: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
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
      const res = await api.get('/customers', search ? { search } : {});
      setCustomers(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search]);

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setError(''); setModalOpen(true); };
  const openEdit = (c) => { setEditItem(c); setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '' }); setError(''); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editItem) await api.put(`/customers/${editItem.id}`, form);
      else await api.post('/customers', form);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Hapus pelanggan "${c.name}"?`)) return;
    try { await api.delete(`/customers/${c.id}`); fetchData(); } catch (err) { alert(err.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, email, telepon..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl">
          <Plus className="w-4 h-4" /> Tambah Pelanggan
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Pelanggan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Kontak</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Tier</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Total Belanja</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Order</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center py-12 text-gray-500">Memuat data...</td></tr>}
              {!loading && customers.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-500">Tidak ada pelanggan ditemukan.</td></tr>}
              {!loading && customers.map(c => (
                <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.address || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="space-y-0.5">
                      {c.email && <p className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</p>}
                      {c.phone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${tierColors[c.member_tier] || tierColors.Regular}`}>
                      <Star className="w-3 h-3" />{c.member_tier}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-green-400">{formatRp(c.total_spent)}</td>
                  <td className="px-5 py-3.5 text-right text-gray-300">{c.total_orders}x</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-indigo-900/30"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/30"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">{error}</div>}
          {[
            { label: 'Nama Lengkap *', key: 'name', type: 'text', required: true },
            { label: 'Email', key: 'email', type: 'email' },
            { label: 'No. Telepon', key: 'phone', type: 'tel' },
            { label: 'Alamat', key: 'address', type: 'text' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{f.label}</label>
              <input type={f.type} required={f.required} value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-gray-700 rounded-xl text-sm text-gray-300 hover:bg-gray-800">Batal</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
