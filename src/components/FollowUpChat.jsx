import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';

function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-amber-400/60"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

export default function FollowUpChat({ messages, loading, error, onSend }) {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <motion.div
      className="w-full mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
    >
      {/* Hint text */}
      {messages.length === 0 && (
        <div className="flex items-center justify-center gap-2 mb-3">
          <motion.span
            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold
                       bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/30"
            animate={{ scale: [1, 1.1, 1], rotate: [0, -3, 3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            HOT
          </motion.span>
          <p className="text-rose-300/90 text-sm font-medium">{t.chatHint}</p>
        </div>
      )}

      {/* Message bubbles */}
      {messages.length > 0 && (
        <div className="mb-3 max-h-[300px] overflow-y-auto px-4 space-y-2 scrollbar-thin">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-500/20 text-amber-100 border border-amber-400/20 rounded-br-md'
                      : 'bg-white/[0.06] backdrop-blur-md text-white/80 border border-white/[0.08] rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading dots */}
          {loading && (
            <motion.div
              className="flex justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl rounded-bl-md">
                <TypingDots />
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-400/70 text-xs text-center mb-2">{t.chatError}</p>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 px-4">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.chatPlaceholder}
          disabled={loading}
          className="flex-1 bg-white/[0.06] backdrop-blur-md border border-white/[0.12]
                     rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder-white/30
                     outline-none transition-colors
                     focus:border-amber-400/30 focus:bg-white/[0.08]
                     disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 rounded-xl text-sm font-medium
                     bg-amber-500/20 border border-amber-400/25 text-amber-300/90
                     transition-all duration-200
                     hover:bg-amber-500/30 hover:border-amber-400/40
                     active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
        >
          {t.chatSend}
        </button>
      </form>
    </motion.div>
  );
}
