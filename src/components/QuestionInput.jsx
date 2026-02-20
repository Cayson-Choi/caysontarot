import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { useLanguage } from '../i18n/LanguageContext';

export default function QuestionInput({ onSubmit, onSkip, onBack }) {
  const [question, setQuestion] = useState('');
  const [focused, setFocused] = useState(false);
  const { t } = useLanguage();

  return (
    <motion.div
      className="min-h-dvh flex items-center justify-center px-4 py-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6 }}
    >
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-1 text-xs text-white/40
                     hover:text-white/60 transition-colors active:scale-95"
        >
          <HiOutlineArrowLeft className="text-sm" />
          {t.back}
        </button>

        {/* Glass card */}
        <div className="relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8">
          {/* Glow effect behind card */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500/20 via-indigo-500/10 to-amber-500/20 blur-xl opacity-50 -z-10" />

          {/* Title */}
          <h2 className="font-serif text-xl md:text-2xl font-semibold text-center mb-2 gold-gradient-text">
            {t.questionTitle}
          </h2>
          <p className="text-white/40 text-xs text-center mb-6">{t.questionPlaceholder}</p>

          {/* Textarea */}
          <div className="relative mb-6">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={t.questionPlaceholder}
              rows={4}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3
                         text-white/90 text-sm placeholder-white/25 resize-none
                         focus:outline-none transition-all duration-500
                         focus:border-amber-400/50 focus:bg-white/8"
            />
            {/* Focus glow */}
            <motion.div
              className="absolute -inset-px rounded-xl pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(168,85,247,0.3))',
              }}
              animate={{ opacity: focused ? 0.6 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Continue button */}
          <motion.button
            onClick={() => onSubmit(question)}
            className="w-full py-3 rounded-xl font-medium text-sm
                       bg-gradient-to-r from-amber-500 to-yellow-500
                       text-gray-900 active:scale-95 transition-transform"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {t.continue}
          </motion.button>

          {/* Skip link */}
          <button
            onClick={onSkip}
            className="w-full mt-3 py-2 text-white/40 text-xs hover:text-white/60
                       transition-colors text-center"
          >
            {t.skip}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
