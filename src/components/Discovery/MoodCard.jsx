import { motion } from "framer-motion";
import { springConfigs } from "../../lib/animations";
import { haptics } from "../../lib/haptics";

/**
 * Mood gradients - warm cinema aesthetics with amber accents
 */
const MOOD_GRADIENTS = {
  vibes: "from-purple-600/80 to-pink-500/80",
  moods: "from-rose-600/80 to-red-500/80",
  chaos: "from-orange-600/80 to-amber-500/80",
  brainy: "from-cyan-600/80 to-blue-500/80",
  dark: "from-slate-800/90 to-gray-900/90",
  comfort: "from-amber-500/80 to-yellow-400/80",
  late: "from-indigo-700/80 to-violet-600/80",
  specific: "from-emerald-600/80 to-teal-500/80"
};

/**
 * Large category/mood card for "Browse by Mood" grid
 * Aspect ratio 16:9 with gradient background
 */
export function MoodCard({ id, label, icon: Icon, onClick }) {
  const gradient = MOOD_GRADIENTS[id] || MOOD_GRADIENTS.vibes;

  const handleClick = () => {
    haptics.light();
    onClick?.(id);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={springConfigs.snappy}
      className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] group"
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      {/* Hover lightening effect */}
      <motion.div
        className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200"
      />

      {/* Border */}
      <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/20 transition-colors duration-200" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.3 }}
        >
          <Icon className="w-10 h-10 text-white/90 mb-2 drop-shadow-lg" />
        </motion.div>
        <span className="text-xl font-heading font-bold text-white drop-shadow-lg">
          {label}
        </span>
      </div>

      {/* Shadow lift */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        initial={{ boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
        whileHover={{ boxShadow: "0 16px 40px rgba(0,0,0,0.4)" }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
}
