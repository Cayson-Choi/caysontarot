import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';

export default function LoadingSpinner() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-8">
      {/* Rotating card with orbiting particles */}
      <div className="relative">
        {/* Outer glow ring */}
        <motion.div
          className="absolute -inset-8 rounded-full"
          animate={{
            boxShadow: [
              '0 0 30px 10px rgba(168,85,247,0.1)',
              '0 0 60px 20px rgba(168,85,247,0.2)',
              '0 0 30px 10px rgba(168,85,247,0.1)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        <motion.div
          className="w-20 h-28 rounded-lg border-2 border-amber-400/60
                     bg-gradient-to-b from-indigo-900/80 to-purple-900/80
                     flex items-center justify-center text-3xl shadow-2xl"
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          style={{ perspective: 800 }}
        >
          <span className="text-amber-400">&#10022;</span>
        </motion.div>

        {/* Orbiting particles */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/80"
            animate={{
              rotate: [i * 60, i * 60 + 360],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{
              top: '50%',
              left: '50%',
              transformOrigin: '0 -40px',
            }}
          />
        ))}
      </div>

      {/* Main text */}
      <div className="text-center">
        <motion.p
          className="text-white/80 text-base font-serif font-semibold mb-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          {t.aiLoading}
        </motion.p>
        <motion.p
          className="text-white/40 text-xs"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        >
          {t.aiLoadingSub}
        </motion.p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-purple-400"
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
