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
 * Individual command palette item
 * Supports recent, suggested, and action types
 */
export function CommandItem({ item, selected, onClick }) {
  const Icon = getIcon(item);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={false}
      animate={{
        backgroundColor: selected ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0)",
      }}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.06)" }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.1 }}
      className="w-full px-4 py-3 flex items-center gap-3 cursor-pointer text-left"
    >
      <motion.div
        initial={false}
        animate={{
          scale: selected ? 1.1 : 1,
          color: selected ? "rgb(251, 191, 36)" : "rgba(255,255,255,0.4)",
        }}
        transition={springConfigs.snappy}
      >
        <Icon className="w-4 h-4 shrink-0" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <motion.span
          className="block truncate font-medium"
          initial={false}
          animate={{ color: selected ? "rgb(255,255,255)" : "rgba(255,255,255,0.7)" }}
          transition={{ duration: 0.1 }}
        >
          {item.label}
        </motion.span>
        {item.description && (
          <span className="block text-xs text-white/40 mt-0.5 truncate">
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
            className="hidden sm:flex items-center px-1.5 py-0.5 text-[10px] text-white/40 bg-white/[0.06] rounded border border-white/[0.08]"
          >
            enter
          </motion.kbd>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
