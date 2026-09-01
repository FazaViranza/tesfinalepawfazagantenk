import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Eye,
  FileText,
  CreditCard,
} from 'lucide-react';

const formatRp = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v || 0);

const formatDate = (d) =>
  new Date(d).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const paymentColors = {
  cash: 'text-green-400',
  qris: 'text-purple-400',
  transfer: 'text-blue-400',
  debit: 'text-yellow-400',
};

const paymentLabels = {
  cash: 'Cash',
  qris: 'QRIS',
  transfer: 'Transfer',
  debit: 'Debit',
};

export default function Transactions() {
  const { user } = useAuth();

  const isOwner = user?.role === 'owner';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedTx, setSelectedTx] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [error, setError] = useState('');

  // ==========================================
  // FETCH TRANSACTIONS
  // ==========================================

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get(
        '/transactions',
        search ? { search } : {}
      );

      setTransactions(res.data || []);
    } catch (err) {
      console.error(
        'Gagal memuat transaksi:',
        err
      );

      setError(
        err.message ||
          'Gagal memuat riwayat transaksi.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  // ==========================================
  // OPEN DETAIL
  // ==========================================

  const openDetail = async (tx) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setSelectedTx(null);

    try {
      const res = await api.get(
        `/transactions/${tx.id}`
      );

      setSelectedTx(res.data);
    } catch (err) {
      console.error(
        'Gagal memuat detail:',
        err
      );

      setError(
        err.message ||
          'Gagal memuat detail transaksi.'
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="space-y-5">

      {/* ======================================
          HEADER
      ====================================== */}

      <div>
        <h1 className="text-xl font-bold text-white">
          {isOwner
            ? 'Semua Transaksi'
            : 'Riwayat Transaksi'}
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          {isOwner
            ? 'Pantau seluruh transaksi yang dilakukan oleh kasir.'
            : 'Lihat transaksi yang dibuat oleh akun kasir ini.'}
        </p>
      </div>

      {/* ======================================
          SEARCH
      ====================================== */}

      <div className="flex items-center gap-3">

        <div className="relative max-w-sm w-full">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Cari nomor invoice..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />

        </div>

        <div className="text-xs text-gray-500">
          {transactions.length} transaksi
        </div>

      </div>

      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ======================================
          TABLE
      ====================================== */}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>

              <tr className="border-b border-gray-800 bg-gray-800/50">

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">
                  Invoice
                </th>

                {isOwner && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">
                    Kasir
                  </th>
                )}

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">
                  Waktu
                </th>

                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase">
                  Pembayaran
                </th>

                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase">
                  Total
                </th>

                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase">
                  Detail
                </th>

              </tr>

            </thead>

            <tbody>

              {/* Loading */}

              {loading && (
                <tr>
                  <td
                    colSpan={isOwner ? 6 : 5}
                    className="text-center py-12 text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-3">

                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />

                      Memuat transaksi...

                    </div>
                  </td>
                </tr>
              )}

              {/* Empty */}

              {!loading &&
                transactions.length === 0 && (
                  <tr>
                    <td
                      colSpan={isOwner ? 6 : 5}
                      className="text-center py-12 text-gray-500"
                    >
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-600" />

                      Tidak ada transaksi ditemukan.
                    </td>
                  </tr>
                )}

              {/* Data */}

              {!loading &&
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >

                    {/* Invoice */}

                    <td className="px-5 py-3.5">

                      <div className="flex items-center gap-2">

                        <FileText className="w-4 h-4 text-gray-500" />

                        <span className="font-mono text-xs font-semibold text-indigo-300">
                          {tx.invoice_no}
                        </span>

                      </div>

                    </td>

                    {/* Owner → Kasir */}

                    {isOwner && (
                      <td className="px-5 py-3.5">

                        <div className="flex items-center gap-2">

                          <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-300 flex items-center justify-center text-xs font-bold">
                            {tx.cashier_name
                              ?.charAt(0)
                              ?.toUpperCase() || '?'}
                          </div>

                          <span className="text-gray-300">
                            {tx.cashier_name || '-'}
                          </span>

                        </div>

                      </td>
                    )}

                    {/* Waktu */}

                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {formatDate(
                        tx.created_at
                      )}
                    </td>

                    {/* Payment */}

                    <td className="px-5 py-3.5 text-center">

                      <span
                        className={`font-semibold text-xs capitalize inline-flex items-center justify-center gap-1 ${
                          paymentColors[
                            tx.payment_method
                          ] ||
                          'text-gray-400'
                        }`}
                      >

                        <CreditCard className="w-3.5 h-3.5" />

                        {paymentLabels[
                          tx.payment_method
                        ] ||
                          tx.payment_method}

                      </span>

                    </td>

                    {/* Total */}

                    <td className="px-5 py-3.5 text-right font-semibold text-green-400">

                      {formatRp(
                        tx.final_amount
                      )}

                    </td>

                    {/* Detail */}

                    <td className="px-5 py-3.5 text-center">

                      <button
                        onClick={() =>
                          openDetail(tx)
                        }
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-indigo-900/30 transition-colors"
                        title="Lihat detail"
                      >

                        <Eye className="w-4 h-4" />

                      </button>

                    </td>

                  </tr>
                ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* ======================================
          DETAIL MODAL
      ====================================== */}

      <Modal
        open={detailOpen}
        onClose={() =>
          setDetailOpen(false)
        }
        title="Detail Transaksi"
        size="lg"
      >

        {detailLoading && (
          <div className="text-center py-8 text-gray-400">

            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />

            Memuat detail transaksi...

          </div>
        )}

        {selectedTx &&
          !detailLoading && (
            <div className="space-y-5">

              {/* ==================================
                  HEADER INFO
              ================================== */}

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800 rounded-xl text-sm">

                <div>

                  <p className="text-xs text-gray-500 mb-0.5">
                    Invoice
                  </p>

                  <p className="font-mono font-bold text-indigo-300">
                    {selectedTx.invoice_no}
                  </p>

                </div>

                <div>

                  <p className="text-xs text-gray-500 mb-0.5">
                    Waktu
                  </p>

                  <p className="font-medium text-white">
                    {formatDate(
                      selectedTx.created_at
                    )}
                  </p>

                </div>

                <div>

                  <p className="text-xs text-gray-500 mb-0.5">
                    Kasir
                  </p>

                  <p className="text-white">
                    {selectedTx.cashier_name ||
                      '-'}
                  </p>

                </div>

                <div>

                  <p className="text-xs text-gray-500 mb-0.5">
                    Pembayaran
                  </p>

                  <p
                    className={`font-semibold capitalize ${
                      paymentColors[
                        selectedTx.payment_method
                      ] ||
                      'text-gray-400'
                    }`}
                  >
                    {paymentLabels[
                      selectedTx.payment_method
                    ] ||
                      selectedTx.payment_method}
                  </p>

                </div>

              </div>

              {/* ==================================
                  ITEMS
              ================================== */}

              <div>

                <h4 className="text-sm font-semibold text-gray-300 mb-2">
                  Item Transaksi
                </h4>

                <div className="space-y-2">

                  {selectedTx.items?.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 border-b border-gray-800"
                      >

                        <div>

                          <p className="text-sm font-medium text-white">
                            {item.product_name}
                          </p>

                          <p className="text-xs text-gray-400">
                            {formatRp(
                              item.unit_price
                            )}{' '}
                            ×{' '}
                            {item.quantity}
                          </p>

                        </div>

                        <p className="font-semibold text-white">
                          {formatRp(
                            item.subtotal
                          )}
                        </p>

                      </div>
                    )
                  )}

                </div>

              </div>

              {/* ==================================
                  SUMMARY
              ================================== */}

              <div className="space-y-2 p-4 bg-gray-800 rounded-xl text-sm">

                <div className="flex justify-between text-gray-300">

                  <span>
                    Subtotal
                  </span>

                  <span>
                    {formatRp(
                      selectedTx.total_amount
                    )}
                  </span>

                </div>

                {Number(
                  selectedTx.discount_amount
                ) > 0 && (
                  <div className="flex justify-between text-red-400">

                    <span>
                      Diskon
                    </span>

                    <span>
                      -{' '}
                      {formatRp(
                        selectedTx.discount_amount
                      )}
                    </span>

                  </div>
                )}

                <div className="flex justify-between font-bold text-white text-base border-t border-gray-700 pt-2">

                  <span>
                    Total Bayar
                  </span>

                  <span className="text-green-400">
                    {formatRp(
                      selectedTx.final_amount
                    )}
                  </span>

                </div>

                <div className="flex justify-between text-gray-400">

                  <span>
                    Dibayar
                  </span>

                  <span>
                    {formatRp(
                      selectedTx.paid_amount
                    )}
                  </span>

                </div>

                {Number(
                  selectedTx.change_amount
                ) > 0 && (
                  <div className="flex justify-between text-yellow-400">

                    <span>
                      Kembalian
                    </span>

                    <span>
                      {formatRp(
                        selectedTx.change_amount
                      )}
                    </span>

                  </div>
                )}

              </div>

            </div>
          )}

      </Modal>

    </div>
  );
}