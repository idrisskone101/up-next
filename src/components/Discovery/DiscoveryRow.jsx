import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

/**
 * Horizontal scrolling row with header and fade edges
 * Scroll snap for smooth card snapping
 */
export function DiscoveryRow({
  title,
  actionLabel = "See all",
  onActionClick,
  children
}) {
  const scrollRef = useRef(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-heading font-semibold text-gray-900">
          {title}
        </h2>
        {onActionClick && (
          <motion.button
            type="button"
            onClick={onActionClick}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1 text-sm text-brand-orange hover:text-brand-red transition-colors"
          >
            {actionLabel}
            <ChevronRight size={16} />
          </motion.button>
        )}
      </div>

      {/* Scroll container with fade edges */}
      <div className="relative">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#FAF8F0] to-transparent z-10 pointer-events-none" />

        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#FAF8F0] to-transparent z-10 pointer-events-none" />

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-none px-1 py-1 -mx-1 scroll-smooth snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
