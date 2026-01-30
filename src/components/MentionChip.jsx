import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { prefersReducedMotion } from "../lib/animations";

const POSTER_BASE = "https://image.tmdb.org/t/p/w92";

// Inline badge animation variants
const inlineBadgeVariants = {
  hidden: {
    opacity: 0,
    scale: 0.7,
    x: -4,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      mass: 0.8,
      filter: { duration: 0.2 },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    x: -6,
    filter: "blur(2px)",
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/**
 * Inline badge showing selected @mention
 * Displays inside input field with poster, title, and remove button
 */
export function MentionChip({ mention, onRemove, onKeyDown, autoFocus = true }) {
  const [isHovered, setIsHovered] = useState(false);
  const reducedMotion = prefersReducedMotion();
  const chipRef = useRef(null);

  // Auto-focus when rendered for keyboard navigation
  useEffect(() => {
    if (autoFocus && chipRef.current) {
      chipRef.current.focus();
    }
  }, [autoFocus]);

  if (!mention) return null;

  const handleKeyDown = (e) => {
    // Handle backspace/delete to remove
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      onRemove?.();
    }
    // Handle enter to submit
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onKeyDown?.(e);
    }
    // Pass other keys to parent handler
    onKeyDown?.(e);
  };

  return (
    <motion.div
      ref={chipRef}
      tabIndex={0}
      variants={reducedMotion ? {} : inlineBadgeVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      whileTap={{ scale: 0.97 }}
      className="inline-flex items-center gap-1.5 h-8 md:h-7 px-2.5 rounded-full bg-brand-golden text-[#481B13] border border-brand-golden shadow-[0_0_12px_rgba(238,199,69,0.25)] text-sm font-medium group relative overflow-hidden cursor-default select-none outline-none focus-visible:ring-2 focus-visible:ring-brand-golden/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0f] hover:bg-brand-golden/90 hover:shadow-[0_0_16px_rgba(238,199,69,0.35)] transition-shadow"
    >
      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          boxShadow: isHovered
            ? "inset 0 0 12px rgba(238,199,69,0.15), 0 0 8px rgba(238,199,69,0.1)"
            : "none",
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Poster thumbnail with hover scale */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {mention.poster_path ? (
          <img
            src={`${POSTER_BASE}${mention.poster_path}`}
            alt=""
            className="w-6 h-6 md:w-5 md:h-5 rounded-full object-cover shrink-0 ring-1 ring-brand-golden/20"
          />
        ) : (
          <div className="w-6 h-6 md:w-5 md:h-5 rounded-full bg-brand-golden/20 shrink-0 flex items-center justify-center">
            <span className="text-[10px] text-brand-orange/60">?</span>
          </div>
        )}
      </motion.div>

      {/* Title with subtle glow on hover */}
      <motion.span
        className="max-w-[100px] md:max-w-[120px] truncate relative z-10"
        animate={{
          textShadow: isHovered
            ? "0 0 8px rgba(224,74,40,0.3)"
            : "none",
        }}
        transition={{ duration: 0.2 }}
      >
        {mention.title}
      </motion.span>

      {/* Remove button - always visible on mobile, hover-reveal on desktop */}
      <motion.div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            onRemove();
          }
        }}
        initial={{ opacity: 1, scale: 1 }}
        animate={{
          opacity: isHovered ? 1 : 0.7,
          scale: isHovered ? 1 : 0.9,
        }}
        whileTap={{ scale: 0.85 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
        }}
        className="ml-0.5 p-0.5 rounded-full hover:bg-brand-golden/25 text-brand-orange/70 hover:text-brand-orange transition-colors relative z-10 cursor-pointer"
        aria-label="Remove mention"
      >
        <X className="w-3 h-3" />
      </motion.div>
    </motion.div>
  );
}
