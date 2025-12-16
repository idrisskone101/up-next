import { motion } from "framer-motion";
import { Search, Sparkles, Film, Frown } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

const iconVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
};

const floatAnimation = {
  y: [0, -8, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

/**
 * Enhanced empty state component with animations
 */
export function EmptyState({ type = "no-results", query, onSuggestionClick }) {
  const states = {
    "no-results": {
      icon: Frown,
      title: "No matches found",
      description: query
        ? `We couldn't find anything matching "${query}". Try different keywords or moods.`
        : "We couldn't find any matches. Try adjusting your search.",
      iconBg: "bg-amber-500/10",
      iconRing: "ring-amber-500/20",
      iconColor: "text-amber-400",
      suggestions: [
        "cozy comfort movies",
        "mind-bending sci-fi",
        "feel-good underdog stories",
      ],
    },
    "search-ready": {
      icon: Sparkles,
      title: "Ready to discover?",
      description:
        "Search by mood, genre, or describe the vibe you're looking for.",
      iconBg: "bg-amber-500/10",
      iconRing: "ring-amber-500/20",
      iconColor: "text-amber-400",
      suggestions: [
        "cozy rainy day vibes",
        "dark psychological thrillers",
        "90s nostalgia trip",
      ],
    },
    error: {
      icon: Film,
      title: "Something went wrong",
      description: "We hit a snag loading content. Please try again.",
      iconBg: "bg-red-500/10",
      iconRing: "ring-red-500/20",
      iconColor: "text-red-400",
      suggestions: [],
    },
  };

  const state = states[type] || states["search-ready"];
  const Icon = state.icon;

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-6 px-4 py-16 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated Icon */}
      <motion.div
        variants={iconVariants}
        animate={floatAnimation}
        className={`flex h-20 w-20 items-center justify-center rounded-full ${state.iconBg} ring-1 ring-inset ${state.iconRing}`}
      >
        <Icon className={`h-9 w-9 ${state.iconColor}`} />
      </motion.div>

      {/* Title and Description */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          {state.title}
        </h3>
        <p className="mx-auto max-w-md text-sm text-muted-foreground/70 leading-relaxed">
          {state.description}
        </p>
      </motion.div>

      {/* Suggestions */}
      {state.suggestions.length > 0 && (
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-4 mt-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
            Try searching for
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {state.suggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                type="button"
                onClick={() => onSuggestionClick?.(suggestion)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.4 + index * 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/60 transition-all hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Decorative elements */}
      <motion.div
        className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        {/* Subtle gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
      </motion.div>
    </motion.div>
  );
}
