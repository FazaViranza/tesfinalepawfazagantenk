import { useState, useRef, useEffect } from 'react';
import api from '../api';
import {
  Bot,
  Send,
  User,
  Sparkles,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MAX_MESSAGE_LENGTH = 2000;

const INITIAL_PROMPTS = [
  'Bagaimana omzet bisnis saya bulan ini?',
  'Produk apa yang paling urgent untuk direstock?',
  'Produk apa yang paling laku bulan ini?',
  'Apa yang sebaiknya saya prioritaskan hari ini?',
];

const getTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

export default function AIChat() {
  const { user } = useAuth();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text:
        `Halo ${user?.name || 'Partner UMKM'}! 👋\n\n` +
        'Saya adalah Asisten Bisnis Pintar UMKM.AI. ' +
        'Saya dapat membantu Anda menganalisis omzet, performa produk, ' +
        'kondisi stok, serta memberikan rekomendasi bisnis berdasarkan data toko.\n\n' +
        'Apa yang ingin Anda analisis hari ini?',
      time: getTime(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const addMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleSend = async (textToSend) => {
    const query =
      typeof textToSend === 'string' && textToSend.trim()
        ? textToSend
        : input;

    const cleanQuery = query.trim();

    if (!cleanQuery || loading) {
      return;
    }

    if (cleanQuery.length > MAX_MESSAGE_LENGTH) {
      addMessage({
        id: `${Date.now()}-error`,
        sender: 'ai',
        isError: true,
        text: `Pesan terlalu panjang. Maksimal ${MAX_MESSAGE_LENGTH} karakter.`,
        time: getTime(),
      });
      return;
    }

    addMessage({
      id: `${Date.now()}-user`,
      sender: 'user',
      text: cleanQuery,
      time: getTime(),
    });

    if (typeof textToSend !== 'string' || !textToSend.trim()) {
      setInput('');
    }

    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: cleanQuery,
      });

      const responseData = res.data;

      addMessage({
        id: `${Date.now()}-ai`,
        sender: 'ai',
        text:
          responseData?.reply ||
          responseData?.message ||
          'Maaf, saya belum dapat memproses pertanyaan tersebut.',
        time: getTime(),
      });
    } catch (err) {
      const backendMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Maaf, terjadi kesalahan saat menghubungi layanan AI. Pastikan backend server berjalan normal.';

      addMessage({
        id: `${Date.now()}-error`,
        sender: 'ai',
        isError: true,
        text: backendMessage,
        time: getTime(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text:
          'Percakapan telah direset. 👋\n\n' +
          `Ada hal lain tentang bisnis Anda yang ingin dianalisis, ${
            user?.name || 'Kak'
          }?`,
        time: getTime(),
      },
    ]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
            <Bot className="w-5 h-5 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Asisten Bisnis UMKM.AI
              </h3>

              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>

            <p className="text-xs text-gray-400">
              Terhubung ke Database & Analitik Toko
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClear}
          title="Bersihkan Percakapan"
          className="p-2 text-gray-400 hover:text-rose-400 hover:bg-gray-800 rounded-xl transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((message) => {
          const isUser = message.sender === 'user';

          const avatarClass = isUser
            ? 'bg-indigo-600 text-white'
            : message.isError
            ? 'bg-rose-950 text-rose-300 border border-rose-800'
            : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md';

          const bubbleClass = isUser
            ? 'bg-indigo-600 text-white rounded-tr-none'
            : message.isError
            ? 'bg-rose-950/40 border border-rose-800/60 text-rose-200 rounded-tl-none'
            : 'bg-gray-800/80 border border-gray-700/60 text-gray-200 rounded-tl-none';

          return (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${avatarClass}`}
              >
                {isUser ? (
                  <User className="w-4 h-4" />
                ) : message.isError ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>

              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${bubbleClass}`}
              >
                <p className="whitespace-pre-wrap break-words">
                  {message.text}
                </p>

                <span
                  className={`text-[10px] block mt-1.5 ${
                    isUser ? 'text-indigo-200 text-right' : 'text-gray-400'
                  }`}
                >
                  {message.time}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>

            <div className="bg-gray-800/80 border border-gray-700/60 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
              <span className="text-xs text-indigo-300 ml-1">
                AI sedang menganalisis data...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 2 && (
        <div className="px-6 py-2 bg-gray-950/40 border-t border-gray-800/60 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-gray-400 font-medium flex-shrink-0">
            Contoh:
          </span>

          {INITIAL_PROMPTS.map((prompt) => (
            <button
              type="button"
              key={prompt}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700/80 flex-shrink-0 transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 border-t border-gray-800 bg-gray-900/90">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Tanyakan omzet, stok, produk, atau strategi bisnis..."
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

        <div className="flex justify-between mt-1.5 px-1">
          <span className="text-[10px] text-gray-600">
            Business AI • Data toko internal
          </span>

          <span className="text-[10px] text-gray-600">
            {input.length}/{MAX_MESSAGE_LENGTH}
          </span>
        </div>
      </div>
    </div>
  );
}
