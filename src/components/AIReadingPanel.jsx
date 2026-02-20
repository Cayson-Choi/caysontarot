import { useRef } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../i18n/LanguageContext';
import LoadingSpinner from './LoadingSpinner';
import CaptureButton from './CaptureButton';

export default function AIReadingPanel({
  reading,
  loading,
  error,
  onRetry,
  onNewReading,
  cards,
  spread,
  question,
}) {
  const { lang, t } = useLanguage();
  const panelRef = useRef(null);

  return (
    <motion.div
      className="min-h-dvh flex flex-col items-center px-4 py-8"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Title */}
      <h2 className="font-serif text-xl md:text-2xl font-semibold mb-6 gold-gradient-text">
        {t.aiReadingTitle}
      </h2>

      {/* Loading state */}
      {loading && <LoadingSpinner />}

      {/* Error state */}
      {error && (
        <div className="w-full max-w-lg text-center py-8">
          <p className="text-red-400/80 text-sm mb-4">{t.aiError}</p>
          <button
            onClick={onRetry}
            className="px-6 py-2 rounded-lg bg-white/10 text-white/70 text-sm
                       hover:bg-white/20 transition-colors active:scale-95"
          >
            {t.retry}
          </button>
        </div>
      )}

      {/* Reading result */}
      {reading && (
        <div className="w-full max-w-lg">
          {/* Capture target area */}
          <div ref={panelRef} className="p-4 rounded-2xl" style={{ backgroundColor: '#0a0e1a' }}>
            {/* Question reminder */}
            {question && (
              <div className="mb-4 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-amber-400/60 mb-0.5">{t.yourQuestion}</p>
                <p className="text-sm text-white/70">{question}</p>
              </div>
            )}

            {/* Card thumbnails */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {cards.map((card) => (
                <div key={card.id} className="flex flex-col items-center">
                  <img
                    src={card.image}
                    alt={lang === 'ko' ? card.nameKo : card.nameEn}
                    className="w-12 h-[82px] md:w-16 md:h-[110px] rounded object-contain
                               border border-white/10"
                  />
                  <span className="text-[9px] md:text-[10px] text-white/40 mt-0.5 max-w-[50px] truncate text-center">
                    {lang === 'ko' ? card.nameKo : card.nameEn}
                  </span>
                </div>
              ))}
            </div>

            {/* AI interpretation text */}
            <motion.div
              className="glass-panel rounded-2xl p-5 md:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="prose-tarot">
                <ReactMarkdown>{reading}</ReactMarkdown>
              </div>
            </motion.div>
          </div>

          {/* Actions (outside capture area) */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mt-6">
            <CaptureButton targetRef={panelRef} />
            <button
              onClick={onNewReading}
              className="px-6 py-2.5 rounded-xl bg-white/10 text-white/70 text-sm
                         font-medium hover:bg-white/15 transition-colors
                         active:scale-95 border border-white/10"
            >
              {t.newReading}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
