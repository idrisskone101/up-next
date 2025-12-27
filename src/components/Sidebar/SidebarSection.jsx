import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { springConfigs } from "../../lib/animations";

/**
 * Collapsible section wrapper for sidebar
 * Section title with chevron toggle
 */
export function SidebarSection({ title, children, defaultOpen = true, collapsed }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // When sidebar is collapsed, don't show section at all
  if (collapsed) {
    return null;
  }

  return (
    <div className="space-y-1">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-1.5 group"
      >
        <span className="text-xs font-semibold text-white/40 tracking-wider uppercase">
          {title}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={springConfigs.snappy}
          className="text-white/30 group-hover:text-white/50 transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ ...springConfigs.snappy, opacity: { duration: 0.15 } }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
