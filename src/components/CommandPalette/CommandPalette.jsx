import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCommandPalette } from "../../contexts/CommandPaletteContext";
import { CommandInput } from "./CommandInput";
import { CommandList } from "./CommandList";
import { useSidebar } from "../../contexts/SidebarContext";
import { useRecentSearches } from "../../hooks/useRecentSearches";
import { springConfigs } from "../../lib/animations";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

const paletteVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 26 },
  },
  exit: { opacity: 0, scale: 0.98, y: 10, transition: { duration: 0.15 } },
};

const SUGGESTED_QUERIES = [
  "Sunday morning coffee vibes",
  "Mind-bending sci-fi",
  "Cozy autumn comfort",
  "Dark but beautiful",
];

/**
 * Command palette overlay - Arc-inspired quick search
 * Triggered via Cmd+K / Ctrl+K
 */
export function CommandPalette() {
  const { isOpen, query, setQuery, close, onSearch, onSurpriseMe, onBrowseCategories } =
    useCommandPalette();
  const { open: openSidebar } = useSidebar();
  const { searches: recentSearches } = useRecentSearches();
  const paletteRef = useRef(null);

  // Focus trap - return focus when closed
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus?.();
    }
  }, [isOpen]);

  // Click outside to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  // Handle search submission
  const handleSearch = (searchQuery) => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
      close();
    }
  };

  // Handle item selection
  const handleSelect = (item) => {
    switch (item.type) {
      case "recent":
      case "suggested":
        handleSearch(item.query);
        break;
      case "action":
        if (item.id === "surprise") {
          // Pick random from suggested
          const randomQuery =
            SUGGESTED_QUERIES[Math.floor(Math.random() * SUGGESTED_QUERIES.length)];
          onSurpriseMe?.(randomQuery);
          close();
        } else if (item.id === "browse") {
          openSidebar();
          onBrowseCategories?.();
          close();
        }
        break;
      default:
        break;
    }
  };

  // Build items list
  const buildItems = () => {
    const items = [];

    // Recent searches (max 5)
    const recentItems = recentSearches.slice(0, 5).map((s, i) => ({
      id: `recent-${i}`,
      type: "recent",
      label: s.query,
      query: s.query,
      section: "RECENT",
    }));

    if (recentItems.length > 0) {
      items.push(...recentItems);
    }

    // Suggested queries
    const suggestedItems = SUGGESTED_QUERIES.map((q, i) => ({
      id: `suggested-${i}`,
      type: "suggested",
      label: q,
      query: q,
      section: "SUGGESTED",
    }));
    items.push(...suggestedItems);

    // Actions
    items.push(
      {
        id: "surprise",
        type: "action",
        label: "Surprise Me",
        description: "Random vibe search",
        section: "ACTIONS",
      },
      {
        id: "browse",
        type: "action",
        label: "Browse Categories",
        description: "Open sidebar",
        section: "ACTIONS",
      }
    );

    return items;
  };

  const items = buildItems();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          style={{
            background: "rgba(10, 10, 15, 0.8)",
            backdropFilter: "blur(4px)",
          }}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={paletteRef}
            className="w-[90%] max-w-[600px] max-h-[480px] overflow-hidden rounded-2xl border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
            style={{ background: "#121218" }}
            variants={paletteVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <CommandInput
              value={query}
              onChange={setQuery}
              onSubmit={() => handleSearch(query)}
            />
            <CommandList items={items} query={query} onSelect={handleSelect} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
