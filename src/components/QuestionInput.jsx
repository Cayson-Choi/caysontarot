import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import BackButton from './BackButton';

export default function QuestionInput({ onSubmit, onSkip, onBack, spreadId }) {
  const [question, setQuestion] = useState('');
  const [choiceA, setChoiceA] = useState('');
  const [choiceB, setChoiceB] = useState('');
  const { t } = useLanguage();
  const isChoice = spreadId === 'choice';

  return (
    <motion.div
      className="min-h-dvh flex items-center justify-center px-4 py-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6 }}
    >
      <div className="w-full max-w-md">
        <BackButton onClick={onBack} />

        {/* Glass card */}
        <div className="relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8">
          {/* Glow effect behind card */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500/20 via-indigo-500/10 to-amber-500/20 blur-xl opacity-50 -z-10" />

          {/* Title */}
          <h2 className="font-serif text-xl md:text-2xl font-semibold text-center mb-2 gold-gradient-text">
            {t.questionTitle}
          </h2>
          <p className="text-white/40 text-xs text-center mb-6">{t.questionPlaceholder}</p>

          {/* Input fields */}
          {isChoice ? (
            <div className="flex flex-col gap-3 mb-6">
              <div className="relative">
                <label className="text-xs text-amber-300/70 mb-1 block">{t.choiceA}</label>
                <input
                  value={choiceA}
                  onChange={(e) => setChoiceA(e.target.value)}
                  placeholder={t.choiceAPlaceholder}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3
                             text-white/90 text-sm placeholder-white/25
                             focus:outline-none transition-all duration-500
                             focus:border-amber-400/50 focus:bg-white/8"
                />
              </div>
              <div className="relative">
                <label className="text-xs text-amber-300/70 mb-1 block">{t.choiceB}</label>
                <input
                  value={choiceB}
                  onChange={(e) => setChoiceB(e.target.value)}
                  placeholder={t.choiceBPlaceholder}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3
                             text-white/90 text-sm placeholder-white/25
                             focus:outline-none transition-all duration-500
                             focus:border-amber-400/50 focus:bg-white/8"
                />
              </div>
            </div>
          ) : (
            <div className="relative mb-6">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t.questionPlaceholder}
                rows={4}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3
                           text-white/90 text-sm placeholder-white/25 resize-none
                           focus:outline-none transition-all duration-300
                           focus:border-amber-400/50 focus:bg-white/8"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <motion.button
              onClick={onSkip}
              className="flex-1 py-3 rounded-xl text-sm font-medium
                         bg-white/[0.06] backdrop-blur-md border border-white/[0.12]
                         text-white/70 transition-all duration-300
                         hover:bg-white/[0.1] hover:border-white/20 hover:text-white/90
                         active:scale-95"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              {t.skip}
            </motion.button>
            <motion.button
              onClick={() => {
                if (isChoice) {
                  const combined = choiceA || choiceB
                    ? `A: ${choiceA || '-'} / B: ${choiceB || '-'}`
                    : '';
                  onSubmit(combined);
                } else {
                  onSubmit(question);
                }
              }}
              className="flex-1 py-3 rounded-xl text-sm font-medium
                         bg-white/[0.06] backdrop-blur-md border border-amber-400/25
                         text-amber-300/90 transition-all duration-300
                         hover:bg-amber-400/[0.08] hover:border-amber-400/40 hover:text-amber-200
                         active:scale-95"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              {t.continue}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
