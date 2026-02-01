import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PIPELINE_STAGES = [
  {
    id: 'analyzing',
    message: 'Reading your vibe',
    duration: 2000,
    icon: '🧠'
  },
  {
    id: 'embedding',
    message: 'Translating to movie language',
    duration: 2000,
    icon: '✨'
  },
  {
    id: 'searching',
    message: 'Searching 60,000 titles',
    duration: 2500,
    icon: '🔍'
  },
  {
    id: 'ranking',
    message: 'Finding your best matches',
    duration: 1500,
    icon: '🎯'
  },
  {
    id: 'waiting',
    message: 'Still searching...',
    duration: 0, // No duration, stays here indefinitely
    icon: '⏳'
  }
];

const springConfigs = {
  gentle: {
    type: "spring",
    stiffness: 300,
    damping: 24
  },
  snappy: {
    type: "spring",
    stiffness: 400,
    damping: 30
  }
};

export default function SearchLoading({ query }) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let elapsed = 0;
    const stagesWithDuration = PIPELINE_STAGES.filter(s => s.duration > 0);
    const totalDuration = stagesWithDuration.reduce((sum, s) => sum + s.duration, 0);

    const timeouts = PIPELINE_STAGES.map((stage, i) => {
      if (stage.duration === 0) return null; // Skip the indefinite stage

      const timeout = setTimeout(() => {
        setCurrentStageIndex(i);
        if (i < stagesWithDuration.length) {
          setProgress(((elapsed + stage.duration) / totalDuration) * 100);
        }
        elapsed += stage.duration;
      }, elapsed);
      elapsed += stage.duration;
      return timeout;
    }).filter(Boolean);

    // After 8s, show "Still searching..." stage
    const finalStageTimeout = setTimeout(() => {
      setCurrentStageIndex(PIPELINE_STAGES.length - 1);
      setProgress(95); // Show near-complete but not 100%
    }, totalDuration);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(finalStageTimeout);
    };
  }, []);

  const currentStage = PIPELINE_STAGES[currentStageIndex];

  return (
    <motion.div
      className="max-w-md mx-auto mt-6 px-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={springConfigs.gentle}
    >
      {/* Card container */}
      <div className="rounded-2xl bg-[#FFFCF5] border border-brand-cream/40 shadow-xl shadow-gray-200/50 p-8">
        {/* Pipeline progress bar */}
        <div className="h-1 rounded-full bg-brand-cream/30 mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-golden to-brand-orange shadow-[0_0_12px_rgba(238,199,69,0.3)]"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* Stage indicator */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage.id}
            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={springConfigs.snappy}
            className="text-center space-y-3"
          >
            {/* Pulsing emoji icon */}
            <motion.div
              className="text-4xl"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.9, 1, 0.9]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {currentStage.icon}
            </motion.div>

            <p className="text-lg text-gray-900 font-medium">
              {currentStage.message}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Subtle query echo */}
        <p className="text-sm text-gray-400 text-center mt-6 italic">
          "{query}"
        </p>
      </div>
    </motion.div>
  );
}
