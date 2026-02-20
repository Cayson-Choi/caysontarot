import { AnimatePresence, motion } from 'framer-motion';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { useTarotReading } from './hooks/useTarotReading';
import { useAIInterpretation } from './hooks/useAIInterpretation';
import StarBackground from './components/StarBackground';
import LanguageToggle from './components/LanguageToggle';
import QuestionInput from './components/QuestionInput';
import CardSelector from './components/CardSelector';
import TarotTable from './components/TarotTable';
import AIReadingPanel from './components/AIReadingPanel';
import Footer from './components/Footer';

function AppInner() {
  const { lang, t } = useLanguage();
  const reading = useTarotReading();
  const ai = useAIInterpretation();

  const handleBegin = () => reading.goToPhase('question');

  const handleQuestionSubmit = (q) => {
    reading.setQuestion(q);
    reading.goToPhase('spread');
  };

  const handleQuestionSkip = () => {
    reading.goToPhase('spread');
  };

  const handleSelectSpread = (spread, customCount) => {
    if (spread.id === 'custom') {
      reading.selectSpreadWithCustom(spread, customCount || reading.customCount);
    } else {
      reading.selectSpread(spread);
    }
  };

  const handleRequestAI = () => {
    reading.goToPhase('result');
    ai.fetchReading({
      cards: reading.drawnCards.map((c) => ({
        nameKo: c.nameKo,
        nameEn: c.nameEn,
        position: reading.spread
          ? (lang === 'ko' ? reading.spread.positionsKo : reading.spread.positionsEn)?.[
              reading.drawnCards.indexOf(c)
            ] || `${reading.drawnCards.indexOf(c) + 1}`
          : `${reading.drawnCards.indexOf(c) + 1}`,
      })),
      spread: lang === 'ko' ? reading.spread?.nameKo : reading.spread?.nameEn,
      question: reading.question,
      lang,
    });
  };

  const handleNewReading = () => {
    reading.reset();
    ai.clearReading();
  };

  const handleRetry = () => {
    handleRequestAI();
  };

  return (
    <div className="relative min-h-dvh flex flex-col">
      <StarBackground />
      <LanguageToggle />

      <main className="relative z-10 flex-1">
        <AnimatePresence mode="wait">
          {/* Intro */}
          {reading.phase === 'intro' && (
            <motion.div
              key="intro"
              className="min-h-dvh flex flex-col items-center justify-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
            >
              <motion.h1
                className="font-serif text-3xl md:text-5xl font-bold mb-3 gold-gradient-text text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {t.title}
              </motion.h1>
              <motion.p
                className="text-white/40 text-sm md:text-base mb-10 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                {t.subtitle}
              </motion.p>
              <motion.button
                className="px-8 py-3.5 rounded-xl font-semibold text-sm
                           bg-gradient-to-r from-amber-500 to-yellow-500
                           text-gray-900 glow-pulse active:scale-95"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBegin}
              >
                {t.beginReading}
              </motion.button>
            </motion.div>
          )}

          {/* Question */}
          {reading.phase === 'question' && (
            <QuestionInput
              key="question"
              onSubmit={handleQuestionSubmit}
              onSkip={handleQuestionSkip}
              onBack={() => reading.goToPhase('intro')}
            />
          )}

          {/* Spread Selection */}
          {reading.phase === 'spread' && (
            <CardSelector
              key="spread"
              onSelect={handleSelectSpread}
              customCount={reading.customCount}
              onCustomCountChange={reading.setCustomCount}
              onBack={() => reading.goToPhase('question')}
            />
          )}

          {/* Card Reading */}
          {reading.phase === 'reading' && (
            <TarotTable
              key="reading"
              cards={reading.drawnCards}
              spread={reading.spread}
              flippedIds={reading.flippedIds}
              onFlip={reading.flipCard}
              allFlipped={reading.allFlipped}
              flippedCount={reading.flippedCount}
              totalCards={reading.totalCards}
              question={reading.question}
              onRequestAI={handleRequestAI}
              onBack={() => reading.goToPhase('spread')}
            />
          )}

          {/* AI Result */}
          {reading.phase === 'result' && (
            <AIReadingPanel
              key="result"
              reading={ai.reading}
              loading={ai.loading}
              error={ai.error}
              onRetry={handleRetry}
              onNewReading={handleNewReading}
              onBack={() => {
                ai.clearReading();
                reading.goToPhase('reading');
              }}
              cards={reading.drawnCards}
              spread={reading.spread}
              question={reading.question}
            />
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}
