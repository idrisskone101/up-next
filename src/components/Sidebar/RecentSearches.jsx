import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import { useRecentSearches } from "../../hooks/useRecentSearches";
import { springConfigs } from "../../lib/animations";

const INITIAL_SHOW = 5;

/**
 * List of recent search queries
 * Clickable items, X to remove, expandable
 */
export function RecentSearches({ onSearchClick, collapsed }) {
  const { searches, removeSearch, clearAll } = useRecentSearches();
  const [showAll, setShowAll] = useState(false);

  if (collapsed || searches.length === 0) {
    return null;
  }

  const displayedSearches = showAll ? searches : searches.slice(0, INITIAL_SHOW);
  const hasMore = searches.length > INITIAL_SHOW;

  return (
    <div className="space-y-1">
      <AnimatePresence initial={false}>
        {displayedSearches.map((search, index) => (
          <motion.div
            key={search.query}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ ...springConfigs.snappy, delay: index * 0.02 }}
            className="group relative"
          >
            <button
              type="button"
              onClick={() => onSearchClick?.(search.query)}
              className="
                w-full text-left px-3 py-2 rounded-lg
                text-sm text-white/50 truncate
                hover:text-white/80 hover:bg-white/[0.04]
                transition-colors duration-150
                pr-8
              "
            >
              {search.query}
            </button>

            {/* Remove button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeSearch(search.query);
              }}
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                w-5 h-5 flex items-center justify-center rounded
                text-white/30 hover:text-white/70 hover:bg-white/10
                opacity-0 group-hover:opacity-100
                transition-all duration-150
              "
              aria-label={`Remove "${search.query}"`}
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Show more / Show less */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="
            flex items-center gap-1 px-3 py-1.5
            text-xs text-white/40 hover:text-white/60
            transition-colors
          "
        >
          <motion.span
            animate={{ rotate: showAll ? 180 : 0 }}
            transition={springConfigs.snappy}
          >
            <ChevronDown className="w-3 h-3" />
          </motion.span>
          {showAll ? "Show less" : `Show ${searches.length - INITIAL_SHOW} more`}
        </button>
      )}

      {/* Clear all */}
      {searches.length > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="
            w-full px-3 py-1.5 text-left
            text-xs text-white/30 hover:text-red-400/70
            transition-colors
          "
        >
          Clear all
        </button>
      )}
    </div>
  );
}
