import { useState, useRef, useEffect } from 'react';
import api from '../api';
import { Bot, Send, User, Sparkles, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const INITIAL_PROMPTS = [
  'Bagaimana tren penjualan toko bulan ini?',
  'Produk apa yang stoknya paling menipis dan perlu restock?',
  'Beri rekomendasi menu bundle hemat untuk meningkatkan omset',
  'Siapa pelanggan paling loyal (tier tertinggi)?',
];

export default function AIChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Halo ${user?.name || 'Partner UMKM'}! Saya adalah Asisten Bisnis Pintar UMKM.AI. Saya siap membantu Anda menganalisis performa penjualan, ketersediaan stok produk, data pelanggan, hingga memberikan saran promo dan strategi bisnis. Apa yang ingin Anda diskusikan hari ini?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: query.trim() });
      const aiReply = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.data.reply || res.data.message || 'Maaf, saya belum dapat memproses pertanyaan tersebut.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.data.sources || [],
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      const errorReply = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        isError: true,
        text: 'Maaf, terjadi kesalahan saat menghubungi layanan AI. ' + (err.message || 'Pastikan backend server berjalan normal.'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Percakapan telah direset. Ada hal lain tentang bisnis Anda yang ingin ditanyakan, ${user?.name || 'Kak'}?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Asisten Bisnis UMKM.AI</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-gray-400">Terhubung ke Database & Analitik Toko</p>
          </div>
        </div>

        <button
          onClick={handleClear}
          title="Bersihkan Percakapan"
          className="p-2 text-gray-400 hover:text-rose-400 hover:bg-gray-800 rounded-xl transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : m.isError
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md'
              }`}
            >
              {m.sender === 'user' ? (
                <User className="w-4 h-4" />
              ) : m.isError ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>

            <div
              className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : m.isError
                  ? 'bg-rose-950/40 border border-rose-800/60 text-rose-200 rounded-tl-none'
                  : 'bg-gray-800/80 border border-gray-700/60 text-gray-200 rounded-tl-none whitespace-pre-wrap'
              }`}
            >
              <p>{m.text}</p>
              <span
                className={`text-[10px] block mt-1.5 ${
                  m.sender === 'user' ? 'text-indigo-200 text-right' : 'text-gray-400'
                }`}
              >
                {m.time}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-gray-800/80 border border-gray-700/60 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
              <span className="text-xs text-indigo-300 ml-1">AI sedang menganalisis data...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      {messages.length <= 2 && (
        <div className="px-6 py-2 bg-gray-950/40 border-t border-gray-800/60 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-gray-400 font-medium flex-shrink-0">Contoh:</span>
          {INITIAL_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700/80 flex-shrink-0 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanyakan analisis penjualan, stok produk, saran promo..."
            disabled={loading}
            className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white p-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
