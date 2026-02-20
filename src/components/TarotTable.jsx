import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import SpreadLayout from './SpreadLayout';
import BackButton from './BackButton';
import { captureElement, downloadCanvas } from '../utils/captureUtils';

export default function TarotTable({
  cards,
  spread,
  flippedIds,
  onFlip,
  onFlipAll,
  allFlipped,
  flippedCount,
  totalCards,
  question,
  onRequestAI,
  onBack,
}) {
  const { lang, t } = useLanguage();
  const captureRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const handleSaveCardImage = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const canvas = await captureElement(captureRef.current);
      downloadCanvas(canvas, 'tarot-cards.png');
    } catch (err) {
      console.error('Capture failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const positions = lang === 'ko' ? spread?.positionsKo : spread?.positionsEn;

  return (
    <motion.div
      className="min-h-dvh flex flex-col items-center justify-center px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <BackButton onClick={onBack} />

      {/* Question display */}
      {question && (
        <motion.div
          className="mb-4 px-4 py-2 rounded-full bg-white/5 border border-white/10
                     text-xs text-white/50 max-w-xs text-center truncate"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-amber-400/60 mr-1">{t.yourQuestion}:</span>
          {question}
        </motion.div>
      )}

      {/* Progress bar */}
      <div className="w-full max-w-xs mb-2">
        <div className="flex justify-between text-xs text-white/40 mb-1">
          <span>{t.cardsRevealed}</span>
          <span className="text-amber-400">{flippedCount}/{totalCards}</span>
        </div>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
            animate={{ width: `${(flippedCount / totalCards) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Tap hint + Flip all button */}
      {!allFlipped && (
        <div className="flex flex-col items-center mb-6 gap-2">
          <motion.p
            className="text-xs text-white/30"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            {t.tapToReveal}
          </motion.p>
          <motion.button
            className="px-4 py-1.5 rounded-lg text-xs font-medium
                       bg-white/[0.06] backdrop-blur-md border border-white/[0.12]
                       text-white/60 transition-all duration-300
                       hover:bg-white/[0.1] hover:border-white/20 hover:text-white
                       active:scale-95"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onFlipAll}
          >
            {t.flipAll}
          </motion.button>
        </div>
      )}

      {allFlipped && <div className="mb-6" />}

      {/* Card spread (interactive view) */}
      <SpreadLayout
        cards={cards}
        spread={spread}
        flippedIds={flippedIds}
        onFlip={onFlip}
        lang={lang}
      />

      {/* Hidden capture area - simple flat layout for screenshot */}
      <div
        ref={captureRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          backgroundColor: '#0a0e1a',
          padding: '24px',
          borderRadius: '16px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          {cards.map((card, i) => (
            <div key={card.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <img
                src={card.image}
                alt={lang === 'ko' ? card.nameKo : card.nameEn}
                style={{
                  width: '120px', height: '206px', objectFit: 'contain', borderRadius: '8px',
                  ...(card.reversed ? { transform: 'rotate(180deg)' } : {}),
                }}
                crossOrigin="anonymous"
              />
              <span style={{ color: 'rgba(251,191,36,0.8)', fontSize: '12px', fontWeight: 500 }}>
                {lang === 'ko' ? card.nameKo : card.nameEn}
              </span>
              {positions && positions[i] && (
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
                  {positions[i]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Buttons - appear when all cards flipped */}
      <AnimatePresence>
        {allFlipped && (
          <motion.div
            className="mt-8 flex gap-3 items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Save card image button */}
            <motion.button
              className="relative w-40 py-3 rounded-xl text-sm font-medium
                         bg-white/[0.06] backdrop-blur-md border border-white/[0.12]
                         text-white/80 transition-all duration-300
                         hover:bg-white/[0.1] hover:border-white/20 hover:text-white
                         active:scale-95 disabled:opacity-40"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleSaveCardImage}
              disabled={saving}
            >
              {t.saveCardImage}
            </motion.button>

            {/* AI Reading button */}
            <motion.button
              className="relative w-40 py-3 rounded-xl text-sm font-medium
                         bg-white/[0.06] backdrop-blur-md border border-amber-400/25
                         text-amber-300/90 transition-all duration-300
                         hover:bg-amber-400/[0.08] hover:border-amber-400/40 hover:text-amber-200
                         active:scale-95"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={onRequestAI}
            >
              <motion.span
                className="absolute inset-0 rounded-xl pointer-events-none"
                animate={{
                  boxShadow: [
                    '0 0 8px rgba(251,191,36,0.08)',
                    '0 0 16px rgba(251,191,36,0.15)',
                    '0 0 8px rgba(251,191,36,0.08)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              {t.getAIReading}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
