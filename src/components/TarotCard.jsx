import { motion, AnimatePresence } from 'framer-motion';
import { CARD_BACK } from '../data/cards';
import { useLanguage } from '../i18n/LanguageContext';

export default function TarotCard({ card, isFlipped, onFlip, positionLabel, index }) {
  const { lang, t } = useLanguage();
  const baseName = lang === 'ko' ? card.nameKo : card.nameEn;
  const cardName = card.reversed ? `${baseName} (${t.reversed})` : baseName;

  const handleFlip = () => {
    if (isFlipped) return;
    onFlip(card.id);
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-1.5"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
    >
      {/* 3D Card Container */}
      <div
        className={`relative select-none ${isFlipped ? 'cursor-default' : 'cursor-pointer'}`}
        style={{ perspective: 1200 }}
        onClick={handleFlip}
      >
        <motion.div
          className="relative w-[105px] h-[180px] md:w-[150px] md:h-[258px]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 1.8, ease: [0.25, 0.8, 0.25, 1] }}
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Back face */}
          <div
            className="absolute inset-0 rounded-lg overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <motion.div
              className="w-full h-full"
              animate={!isFlipped ? { y: [0, 3, 0] } : {}}
              transition={!isFlipped ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : {}}
            >
              <img
                src={CARD_BACK}
                alt="card back"
                className="w-full h-full object-contain rounded-lg"
                draggable={false}
              />
              {/* Unflipped glow pulse */}
              {!isFlipped && (
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  animate={{ opacity: [0, 0.4, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    boxShadow: '0 0 15px 3px rgba(251,191,36,0.3), inset 0 0 15px 3px rgba(251,191,36,0.1)',
                  }}
                />
              )}
            </motion.div>
          </div>

          {/* Front face */}
          <div
            className="absolute inset-0 rounded-lg overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <img
              src={card.image}
              alt={cardName}
              className="w-full h-full object-contain rounded-lg"
              style={card.reversed ? { transform: 'rotate(180deg)' } : {}}
              draggable={false}
            />
            {/* Golden border glow for revealed card */}
            <div
              className="absolute inset-0 rounded-lg pointer-events-none"
              style={{
                boxShadow: '0 0 12px 2px rgba(251,191,36,0.15), inset 0 0 1px rgba(251,191,36,0.3)',
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Card name (visible after flip) */}
      <AnimatePresence>
        {isFlipped && (
          <motion.p
            className="text-xs md:text-sm text-amber-300/80 font-medium text-center max-w-[100px] md:max-w-[150px] truncate"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {cardName}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Position label */}
      {positionLabel && (
        <p className="text-[10px] md:text-xs text-white/30 text-center">
          {positionLabel}
        </p>
      )}
    </motion.div>
  );
}
