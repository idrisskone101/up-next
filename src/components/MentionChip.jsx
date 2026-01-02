import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import {
  mentionChipVariants,
  prefersReducedMotion,
} from "../lib/animations";

const POSTER_BASE = "https://image.tmdb.org/t/p/w92";

/**
 * Chip showing selected @mention
 * Displays poster, title, and remove button with polished animations
 */
export function MentionChip({ mention, onRemove }) {
  const [isHovered, setIsHovered] = useState(false);
  const reducedMotion = prefersReducedMotion();

  if (!mention) return null;

  return (
    <motion.div
      variants={reducedMotion ? {} : mentionChipVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileTap={{ scale: 0.97 }}
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300 text-sm font-medium group relative overflow-hidden"
    >
      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          boxShadow: isHovered
            ? "inset 0 0 12px rgba(245,158,11,0.15), 0 0 8px rgba(245,158,11,0.1)"
            : "none",
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Tiny poster with hover scale */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {mention.poster_path ? (
          <img
            src={`${POSTER_BASE}${mention.poster_path}`}
            alt=""
            className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-amber-500/20"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-amber-500/20 shrink-0 flex items-center justify-center">
            <span className="text-[10px] text-amber-400/60">?</span>
          </div>
        )}
      </motion.div>

      {/* Title with subtle glow on hover */}
      <motion.span
        className="max-w-[100px] truncate relative z-10"
        animate={{
          textShadow: isHovered
            ? "0 0 8px rgba(252,211,77,0.4)"
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
        className="ml-0.5 p-0.5 rounded-full hover:bg-amber-500/25 text-amber-400/70 hover:text-amber-300 transition-colors relative z-10 cursor-pointer"
        aria-label="Remove mention"
      >
        <X className="w-3 h-3" />
      </motion.div>
    </motion.div>
  );
}
