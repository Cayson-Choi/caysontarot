import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { useLanguage } from '../i18n/LanguageContext';
import { spreads } from '../data/spreads';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function CardSelector({ onSelect, customCount, onCustomCountChange, onBack }) {
  const { lang, t } = useLanguage();
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <motion.div
      className="min-h-dvh flex flex-col items-center justify-center px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
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

      {/* Title */}
      <h2 className="font-serif text-xl md:text-2xl font-semibold mb-1 gold-gradient-text">
        {t.selectSpread}
      </h2>
      <p className="text-white/40 text-xs mb-6">{t.selectSpreadDesc}</p>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full max-w-2xl"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {spreads.map((sp) => {
          const isCustom = sp.id === 'custom';
          const name = lang === 'ko' ? sp.nameKo : sp.nameEn;
          const desc = lang === 'ko' ? sp.descKo : sp.descEn;
          const isHovered = hoveredId === sp.id;

          return (
            <motion.button
              key={sp.id}
              variants={item}
              onMouseEnter={() => setHoveredId(sp.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => {
                if (isCustom) {
                  onSelect(sp, customCount);
                } else {
                  onSelect(sp);
                }
              }}
              className="relative group rounded-xl bg-white/5 backdrop-blur-md
                         border border-white/10 p-4 text-left
                         transition-all duration-300
                         hover:border-amber-400/40 hover:bg-white/8
                         active:scale-95 min-h-[100px]"
            >
              {/* Hover glow */}
              <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-purple-500/0 to-amber-500/0
                              group-hover:from-purple-500/20 group-hover:to-amber-500/10
                              transition-all duration-300 -z-10 blur-sm" />

              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-semibold text-white/90">{name}</span>
                {!isCustom && (
                  <span className="text-xs bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-full">
                    {sp.count}
                  </span>
                )}
              </div>

              <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{desc}</p>

              {/* Custom count stepper */}
              {isCustom && (
                <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCustomCountChange(Math.max(1, customCount - 1));
                    }}
                    className="w-7 h-7 rounded-full bg-white/10 text-white/60
                               flex items-center justify-center text-sm
                               hover:bg-white/20 active:scale-90 transition-all"
                  >
                    -
                  </button>
                  <span className="text-amber-400 font-semibold text-sm w-4 text-center">
                    {customCount}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCustomCountChange(Math.min(10, customCount + 1));
                    }}
                    className="w-7 h-7 rounded-full bg-white/10 text-white/60
                               flex items-center justify-center text-sm
                               hover:bg-white/20 active:scale-90 transition-all"
                  >
                    +
                  </button>
                </div>
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
