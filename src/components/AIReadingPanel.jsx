import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineMail } from 'react-icons/hi';
import { useLanguage } from '../i18n/LanguageContext';
import LoadingSpinner from './LoadingSpinner';
import BackButton from './BackButton';
import FollowUpChat from './FollowUpChat';
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
  chatMessages,
  chatLoading,
  chatError,
  onSendChat,
}) {
  const { lang, t } = useLanguage();
  const captureRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const handleSaveImage = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const canvas = await captureElement(captureRef.current);
      downloadCanvas(canvas, 'tarot-reading.png');
    } catch (err) {
      console.error('Capture failed:', err);
    } finally {
      setSaving(false);
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

  const positions = lang === 'ko' ? spread?.positionsKo : spread?.positionsEn;
  const isYesNo = spread?.id === 'yesno';

  return (
    <motion.div
      className="min-h-dvh flex flex-col items-center px-0 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <BackButton onClick={onBack} />

      {/* Loading state */}
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

        {/* Reading result */}
        {reading && !loading && (
          <motion.div
            key="result"
            className="w-full px-0"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Card thumbnails row */}
            <motion.div
              className="flex flex-wrap justify-center gap-2 mb-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {cards.map((card, i) => (
                <motion.div
                  key={card.id}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                >
                  <img
                    src={card.image}
                    alt={lang === 'ko' ? card.nameKo : card.nameEn}
                    className="w-14 h-[96px] md:w-18 md:h-[124px] rounded-md object-contain
                               border border-amber-400/20 shadow-lg shadow-amber-900/20"
                    style={card.reversed ? { transform: 'rotate(180deg)' } : {}}
                  />
                  <span className="text-[9px] md:text-[10px] text-amber-300/50 mt-1 max-w-[56px] truncate text-center">
                    {lang === 'ko' ? card.nameKo : card.nameEn}
                  </span>
                  {positions && positions[i] && (
                    <span className="text-[8px] text-white/25">{positions[i]}</span>
                  )}
                </motion.div>
              ))}
            </motion.div>

            {/* Scroll with real background image */}
            <motion.div
              className={`scroll-bg${isYesNo ? ' scroll-bg--compact' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <div className="scroll-bg-content">
                {/* Top ornament */}
                <div className="parchment-ornament">✦ ✦ ✦</div>

                {/* Section title */}
                <h2 className="parchment-title">{t.aiReadingTitle}</h2>

                {/* Decorative divider */}
                <div className="parchment-divider" />

                {/* Question */}
                {question && (
                  <p className="parchment-body" style={{ marginBottom: '10px', color: '#8b1a1a', fontWeight: 700 }}>
                    Q. {question}
                  </p>
                )}

                {/* AI reading text */}
                <div className={`parchment-body ${lang === 'ko' ? 'parchment-body--ko' : 'parchment-body--en'}`}>{reading}</div>

                {/* Bottom ornament */}
                <div className="parchment-divider" />
                <div className="parchment-ornament">✦</div>
              </div>
            </motion.div>

            {/* Hidden capture area */}
            <div
              ref={captureRef}
              style={{
                position: 'absolute',
                left: '-9999px',
                top: 0,
                width: '500px',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {/* Parchment background for capture */}
              <div style={{
                background: 'linear-gradient(180deg, #2a2218 0%, #1e1a14 100%)',
                padding: '28px 24px',
                borderRadius: '16px',
                border: '1px solid rgba(251,191,36,0.15)',
              }}>
                {/* Card images */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
                  {cards.map((card) => (
                    <div key={card.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img
                        src={card.image}
                        alt={lang === 'ko' ? card.nameKo : card.nameEn}
                        style={{
                          width: '60px', height: '103px', objectFit: 'contain', borderRadius: '4px',
                          ...(card.reversed ? { transform: 'rotate(180deg)' } : {}),
                        }}
                        crossOrigin="anonymous"
                      />
                      <span style={{ fontSize: '9px', color: 'rgba(251,191,36,0.5)', marginTop: '4px' }}>
                        {lang === 'ko' ? card.nameKo : card.nameEn}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Parchment area */}
                <div style={{
                  background: 'linear-gradient(170deg, #f5e6c8 0%, #e8d5a8 30%, #dcc99a 70%, #d4be8c 100%)',
                  borderRadius: '12px',
                  padding: '24px 20px',
                  border: '1px solid rgba(180,150,90,0.3)',
                  boxShadow: 'inset 0 2px 8px rgba(120,80,20,0.15)',
                }}>
                  {/* Title */}
                  <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '10px', color: '#8b7355', letterSpacing: '4px' }}>✦ ✦ ✦</span>
                    <h2 style={{
                      fontFamily: 'Playfair Display, Georgia, serif',
                      fontSize: '18px', fontWeight: 700,
                      color: '#4a3520', margin: '8px 0',
                    }}>{t.aiReadingTitle}</h2>
                    <div style={{
                      height: '1px', margin: '0 auto', width: '60%',
                      background: 'linear-gradient(to right, transparent, #8b7355, transparent)',
                    }} />
                  </div>

                  {/* Question */}
                  {question && (
                    <div style={{
                      marginBottom: '14px', padding: '8px 12px',
                      background: 'rgba(120,80,20,0.08)', borderRadius: '8px',
                      borderLeft: '3px solid #8b7355',
                    }}>
                      <span style={{ fontSize: '10px', color: '#8b7355' }}>{t.yourQuestion}</span>
                      <p style={{ fontSize: '13px', color: '#4a3520', margin: '2px 0 0' }}>{question}</p>
                    </div>
                  )}

                  {/* Reading text */}
                  <div style={{
                    fontSize: '13px', lineHeight: '1.8', color: '#3d2b1a',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {reading}
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '14px' }}>
                    <span style={{ fontSize: '10px', color: '#8b7355' }}>✦</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <motion.div
              className="flex gap-3 items-center justify-center mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <button
                onClick={handleSaveImage}
                disabled={saving}
                className="flex-1 max-w-[140px] py-3 rounded-xl text-sm font-medium
                           bg-white/[0.06] backdrop-blur-md border border-white/[0.12]
                           text-white/70 transition-all duration-300
                           hover:bg-white/[0.1] hover:border-white/20 hover:text-white/90
                           active:scale-95 disabled:opacity-40"
              >
                {t.saveImage}
              </button>

              <button
                onClick={handleSendEmail}
                className="flex-1 max-w-[140px] py-3 rounded-xl text-sm font-medium
                           bg-white/[0.06] backdrop-blur-md border border-white/[0.12]
                           text-white/70 transition-all duration-300
                           hover:bg-white/[0.1] hover:border-white/20 hover:text-white/90
                           active:scale-95"
              >
                {t.sendEmail}
              </button>

              <button
                onClick={onNewReading}
                className="flex-1 max-w-[140px] py-3 rounded-xl text-sm font-medium
                           bg-white/[0.06] backdrop-blur-md border border-amber-400/25
                           text-amber-300/90 transition-all duration-300
                           hover:bg-amber-400/[0.08] hover:border-amber-400/40 hover:text-amber-200
                           active:scale-95"
              >
                {t.newReading}
              </button>
            </motion.div>

            {/* Follow-up Chat */}
            <FollowUpChat
              messages={chatMessages || []}
              loading={chatLoading}
              error={chatError}
              onSend={onSendChat}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
