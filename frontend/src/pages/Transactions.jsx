import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';
import { Search, Eye, FileText, CreditCard } from 'lucide-react';

const formatRp = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);
const formatDate = (d) => new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const paymentColors = { cash: 'text-green-400', qris: 'text-purple-400', transfer: 'text-blue-400', debit: 'text-yellow-400' };

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions', search ? { search } : {});
      setTransactions(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search]);

  const openDetail = async (tx) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setSelectedTx(null);
    try {
      const res = await api.get(`/transactions/${tx.id}`);
      setSelectedTx(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nomor invoice atau pelanggan..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Invoice</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Pelanggan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Waktu</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Pembayaran</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Total</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Detail</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center py-12 text-gray-500">Memuat data...</td></tr>}
              {!loading && transactions.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-500">Tidak ada transaksi ditemukan.</td></tr>}
              {!loading && transactions.map(tx => (
                <tr key={tx.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="font-mono text-xs font-semibold text-indigo-300">{tx.invoice_no}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-300">{tx.customer_name || 'Walk-in'}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{formatDate(tx.created_at)}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`font-semibold text-xs capitalize flex items-center justify-center gap-1 ${paymentColors[tx.payment_method] || 'text-gray-400'}`}>
                      <CreditCard className="w-3.5 h-3.5" /> {tx.payment_method}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-green-400">{formatRp(tx.final_amount)}</td>
                  <td className="px-5 py-3.5 text-center">
                    <button onClick={() => openDetail(tx)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-indigo-900/30">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Detail Transaksi" size="lg">
        {detailLoading && <div className="text-center py-8 text-gray-400">Memuat detail transaksi...</div>}
        {selectedTx && !detailLoading && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800 rounded-xl text-sm">
              <div><p className="text-xs text-gray-500 mb-0.5">Invoice</p><p className="font-mono font-bold text-indigo-300">{selectedTx.invoice_no}</p></div>
              <div><p className="text-xs text-gray-500 mb-0.5">Pelanggan</p><p className="font-medium text-white">{selectedTx.customer_name || 'Walk-in Customer'}</p></div>
              <div><p className="text-xs text-gray-500 mb-0.5">Kasir</p><p className="text-white">{selectedTx.cashier_name}</p></div>
              <div><p className="text-xs text-gray-500 mb-0.5">Pembayaran</p><p className={`font-semibold capitalize ${paymentColors[selectedTx.payment_method]}`}>{selectedTx.payment_method}</p></div>
            </div>

            {/* Items */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Item Pesanan</h4>
              <div className="space-y-2">
                {selectedTx.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-800">
                    <div>
                      <p className="text-sm font-medium text-white">{item.product_name}</p>
                      <p className="text-xs text-gray-400">{formatRp(item.unit_price)} × {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-white">{formatRp(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2 p-4 bg-gray-800 rounded-xl text-sm">
              <div className="flex justify-between text-gray-300"><span>Subtotal</span><span>{formatRp(selectedTx.total_amount)}</span></div>
              {selectedTx.discount_amount > 0 && <div className="flex justify-between text-red-400"><span>Diskon</span><span>- {formatRp(selectedTx.discount_amount)}</span></div>}
              <div className="flex justify-between font-bold text-white text-base border-t border-gray-700 pt-2"><span>Total Bayar</span><span className="text-green-400">{formatRp(selectedTx.final_amount)}</span></div>
              <div className="flex justify-between text-gray-400"><span>Dibayar</span><span>{formatRp(selectedTx.paid_amount)}</span></div>
              {selectedTx.change_amount > 0 && <div className="flex justify-between text-yellow-400"><span>Kembalian</span><span>{formatRp(selectedTx.change_amount)}</span></div>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
