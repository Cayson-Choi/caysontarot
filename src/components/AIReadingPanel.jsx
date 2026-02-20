import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { HiOutlineCamera, HiOutlineMail, HiOutlineArrowLeft } from 'react-icons/hi';
import { useLanguage } from '../i18n/LanguageContext';
import LoadingSpinner from './LoadingSpinner';
import { captureElement, downloadCanvas } from '../utils/captureUtils';

export default function AIReadingPanel({
  reading,
  loading,
  error,
  onRetry,
  onNewReading,
  onBack,
  cards,
  spread,
  question,
}) {
  const { lang, t } = useLanguage();
  const panelRef = useRef(null);

  const handleSaveImage = async () => {
    if (!panelRef.current) return;
    try {
      const canvas = await captureElement(panelRef.current);
      downloadCanvas(canvas, 'tarot-reading.png');
    } catch (err) {
      console.error('Capture failed:', err);
    }
  };

  const handleSendEmail = () => {
    const cardNames = cards
      .map((c) => (lang === 'ko' ? c.nameKo : c.nameEn))
      .join(', ');

    const body = [
      question ? `${t.yourQuestion}: ${question}` : '',
      '',
      `${lang === 'ko' ? '스프레드' : 'Spread'}: ${lang === 'ko' ? spread?.nameKo : spread?.nameEn}`,
      `${lang === 'ko' ? '카드' : 'Cards'}: ${cardNames}`,
      '',
      '---',
      '',
      reading,
    ]
      .filter(Boolean)
      .join('\n');

    const subject = encodeURIComponent(t.emailSubject);
    const encodedBody = encodeURIComponent(body);
    window.open(`mailto:?subject=${subject}&body=${encodedBody}`);
  };

  return (
    <motion.div
      className="min-h-dvh flex flex-col items-center px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="self-start mb-4 flex items-center gap-1 text-xs text-white/40
                   hover:text-white/60 transition-colors active:scale-95"
      >
        <HiOutlineArrowLeft className="text-sm" />
        {t.back}
      </button>

      {/* Loading state - centered */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            className="flex-1 flex items-center justify-center w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
          >
            <LoadingSpinner />
          </motion.div>
        )}

        {/* Error state */}
        {error && !loading && (
          <motion.div
            key="error"
            className="flex-1 flex items-center justify-center w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center py-8">
              <p className="text-red-400/80 text-sm mb-4">{t.aiError}</p>
              <button
                onClick={onRetry}
                className="px-6 py-2 rounded-lg bg-white/10 text-white/70 text-sm
                           hover:bg-white/20 transition-colors active:scale-95"
              >
                {t.retry}
              </button>
            </div>
          </motion.div>
        )}

        {/* Reading result - unfold animation */}
        {reading && !loading && (
          <motion.div
            key="result"
            className="w-full max-w-lg"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Title */}
            <motion.h2
              className="font-serif text-xl md:text-2xl font-semibold mb-6 gold-gradient-text text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {t.aiReadingTitle}
            </motion.h2>

            {/* Capture target area */}
            <div ref={panelRef} className="p-4 rounded-2xl" style={{ backgroundColor: '#0a0e1a' }}>
              {/* Question reminder */}
              {question && (
                <motion.div
                  className="mb-4 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <p className="text-xs text-amber-400/60 mb-0.5">{t.yourQuestion}</p>
                  <p className="text-sm text-white/70">{question}</p>
                </motion.div>
              )}

              {/* Card thumbnails */}
              <motion.div
                className="flex flex-wrap justify-center gap-2 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {cards.map((card, i) => (
                  <motion.div
                    key={card.id}
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
                  >
                    <img
                      src={card.image}
                      alt={lang === 'ko' ? card.nameKo : card.nameEn}
                      className="w-12 h-[82px] md:w-16 md:h-[110px] rounded object-contain
                                 border border-white/10"
                    />
                    <span className="text-[9px] md:text-[10px] text-white/40 mt-0.5 max-w-[50px] truncate text-center">
                      {lang === 'ko' ? card.nameKo : card.nameEn}
                    </span>
                  </motion.div>
                ))}
              </motion.div>

              {/* AI interpretation text */}
              <motion.div
                className="glass-panel rounded-2xl p-5 md:p-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <div className="prose-tarot">
                  <ReactMarkdown>{reading}</ReactMarkdown>
                </div>
              </motion.div>
            </div>

            {/* Action buttons (outside capture area) */}
            <motion.div
              className="flex flex-col gap-3 items-center mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              {/* Primary row */}
              <div className="flex flex-wrap gap-3 items-center justify-center">
                {/* Save image */}
                <button
                  onClick={handleSaveImage}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                             bg-gradient-to-r from-purple-600 to-indigo-600
                             text-white text-sm font-medium
                             hover:from-purple-500 hover:to-indigo-500
                             active:scale-95 transition-all"
                >
                  <HiOutlineCamera className="text-base" />
                  {t.saveImage}
                </button>

                {/* Send email */}
                <button
                  onClick={handleSendEmail}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                             bg-gradient-to-r from-emerald-600 to-teal-600
                             text-white text-sm font-medium
                             hover:from-emerald-500 hover:to-teal-500
                             active:scale-95 transition-all"
                >
                  <HiOutlineMail className="text-base" />
                  {t.sendEmail}
                </button>
              </div>

              {/* New reading */}
              <button
                onClick={onNewReading}
                className="px-6 py-2.5 rounded-xl bg-white/10 text-white/70 text-sm
                           font-medium hover:bg-white/15 transition-colors
                           active:scale-95 border border-white/10"
              >
                {t.newReading}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
