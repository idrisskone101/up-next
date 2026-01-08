import { motion, AnimatePresence } from "framer-motion";
import { Clock, Sparkles, Wand2, LayoutGrid } from "lucide-react";
import { springConfigs } from "../../lib/animations";

/**
 * Get icon for item type
 */
function getIcon(item) {
  switch (item.type) {
    case "recent":
      return Clock;
    case "suggested":
      return Sparkles;
    case "action":
      return item.id === "surprise" ? Wand2 : LayoutGrid;
    default:
      return Sparkles;
  }
}

/**
 * Individual command palette item with playful selection animation
 * Supports recent, suggested, and action types
 */
export function CommandItem({ item, selected, onClick }) {
  const Icon = getIcon(item);
  const hasEmoji = item.emoji;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={false}
      animate={{
        backgroundColor: selected ? "rgba(238, 199, 69, 0.12)" : "rgba(0,0,0,0)",
        x: selected ? 4 : 0,
      }}
      whileHover={{ backgroundColor: "rgba(238, 199, 69, 0.06)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
      className="w-full px-4 py-3 flex items-center gap-3 cursor-pointer text-left"
    >
      {/* Emoji or Icon */}
      <motion.div
        initial={false}
        animate={{
          scale: selected ? 1.2 : 1,
          rotate: selected ? [0, -10, 10, 0] : 0,
          color: selected ? "#E04A28" : "rgba(0,0,0,0.4)",
        }}
        transition={{
          scale: { type: "spring", stiffness: 500, damping: 20 },
          rotate: { duration: 0.4, ease: "easeOut" },
        }}
        className="w-5 h-5 flex items-center justify-center shrink-0"
      >
        {hasEmoji ? (
          <span className="text-base">{item.emoji}</span>
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </motion.div>
      <div className="flex-1 min-w-0">
        <motion.span
          className="block truncate font-medium"
          initial={false}
          animate={{ color: selected ? "#1a1a1e" : "rgba(0,0,0,0.7)" }}
          transition={{ duration: 0.1 }}
        >
          {item.label}
        </motion.span>
        {item.description && (
          <span className="block text-xs text-gray-400 mt-0.5 truncate">
            {item.description}
          </span>
        )}
      </div>
      <AnimatePresence>
        {selected && (
          <motion.kbd
            initial={{ opacity: 0, scale: 0.8, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 10 }}
            transition={{ duration: 0.15 }}
            className="hidden sm:flex items-center px-1.5 py-0.5 text-[10px] text-gray-400 bg-gray-100 rounded border border-gray-200"
          >
            enter
          </motion.kbd>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
