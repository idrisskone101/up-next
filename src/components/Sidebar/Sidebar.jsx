import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Sparkles,
  Grid3X3,
  Clock,
  Heart,
  Flame,
  Brain,
  Skull,
  Popcorn,
  Moon
} from "lucide-react";
import { useSidebar } from "../../contexts/SidebarContext";
import { QUERY_CATEGORIES, getRandomQuery, getRandomQueryFromCategory } from "../../lib/categories";
import { springConfigs } from "../../lib/animations";
import { SidebarNav } from "./SidebarNav";
import { SidebarSection } from "./SidebarSection";
import { SidebarSearch } from "./SidebarSearch";
import { RecentSearches } from "./RecentSearches";
import { MobileDrawer } from "./MobileDrawer";

// Icon map for categories
const ICON_MAP = {
  Sparkles,
  Heart,
  Flame,
  Brain,
  Skull,
  Popcorn,
  Moon,
  Clock
};

// Nav items stagger animation
const navContainerVariants = {
  collapsed: { opacity: 0 },
  expanded: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.1 }
  }
};

const navItemVariants = {
  collapsed: { opacity: 0, x: -10 },
  expanded: { opacity: 1, x: 0 }
};

/**
 * Shared sidebar content used by both desktop and mobile
 */
function SidebarContent({ onSearch, onSurpriseMe, onCategorySelect, onClose, isExpanded = true }) {
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);

  const handleSurpriseMe = () => {
    const query = getRandomQuery();
    onSurpriseMe?.(query);
    onClose?.();
  };

  const handleCategoryClick = (categoryId) => {
    const query = getRandomQueryFromCategory(categoryId);
    if (query) {
      onCategorySelect?.(query);
      onClose?.();
    }
  };

  const handleSearchSubmit = (query) => {
    onSearch?.(query);
    onClose?.();
  };

  return (
    <>
      {/* Search input */}
      <div className="shrink-0 mb-4">
        <SidebarSearch onSearch={handleSearchSubmit} collapsed={!isExpanded} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none px-2.5 space-y-6">
        {/* DISCOVER section */}
        <SidebarSection title="Discover" collapsed={!isExpanded}>
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.div
                variants={navContainerVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="space-y-0.5"
              >
                <motion.div variants={navItemVariants}>
                  <SidebarNav
                    icon={Home}
                    label="Home"
                    active={false}
                    onClick={() => {
                      onClose?.();
                    }}
                    collapsed={!isExpanded}
                  />
                </motion.div>

                <motion.div variants={navItemVariants}>
                  <SidebarNav
                    icon={Sparkles}
                    label="Surprise Me"
                    active={false}
                    onClick={handleSurpriseMe}
                    collapsed={!isExpanded}
                  />
                </motion.div>

                {/* Categories toggle */}
                <motion.div variants={navItemVariants}>
                  <button
                    type="button"
                    onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                    className="
                      flex items-center justify-between w-full
                      px-3 py-2.5 rounded-lg text-sm font-medium
                      text-white/70 hover:text-white/90 hover:bg-white/[0.04]
                      transition-colors duration-200
                    "
                  >
                    <span className="flex items-center gap-3">
                      <Grid3X3 className="w-4 h-4" />
                      Categories
                    </span>
                    <motion.span
                      animate={{ rotate: categoriesExpanded ? 180 : 0 }}
                      transition={springConfigs.snappy}
                    >
                      <ChevronLeft className="w-3.5 h-3.5 rotate-[-90deg]" />
                    </motion.span>
                  </button>
                </motion.div>

                {/* Categories submenu */}
                <AnimatePresence>
                  {categoriesExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ ...springConfigs.snappy, opacity: { duration: 0.15 } }}
                      className="overflow-hidden pl-3"
                    >
                      <div className="space-y-0.5 py-1 border-l border-white/[0.06] pl-3">
                        {QUERY_CATEGORIES.map((category, index) => {
                          const Icon = ICON_MAP[category.icon];
                          return (
                            <motion.button
                              key={category.id}
                              type="button"
                              onClick={() => handleCategoryClick(category.id)}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ ...springConfigs.snappy, delay: index * 0.02 }}
                              whileHover={{ x: 2, backgroundColor: "rgba(255,255,255,0.04)" }}
                              whileTap={{ scale: 0.98 }}
                              className="
                                flex items-center gap-2 w-full
                                px-2 py-2 rounded-lg text-sm
                                text-white/50 hover:text-white/80
                                transition-colors duration-150
                                min-h-[44px]
                              "
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {category.label}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </SidebarSection>

        {/* RECENT SEARCHES section */}
        <SidebarSection title="Recent Searches" collapsed={!isExpanded}>
          <RecentSearches
            onSearchClick={(query) => {
              onSearch?.(query);
              onClose?.();
            }}
            collapsed={!isExpanded}
          />
        </SidebarSection>
      </div>

      {/* Bottom spacer */}
      <div className="h-4 shrink-0" />
    </>
  );
}

/**
 * Desktop sidebar - collapsible icon rail / expanded nav
 */
function DesktopSidebar({ onSearch, onSurpriseMe, onCategorySelect }) {
  const { isOpen, toggle } = useSidebar();
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);

  const handleSurpriseMe = () => {
    const query = getRandomQuery();
    onSurpriseMe?.(query);
  };

  const handleCategoryClick = (categoryId) => {
    const query = getRandomQueryFromCategory(categoryId);
    if (query) {
      onCategorySelect?.(query);
    }
  };

  return (
    <motion.aside
      className="fixed top-0 left-0 h-dvh z-[60] flex flex-col border-r border-white/[0.06] overflow-hidden"
      style={{ backgroundColor: "var(--surface-elevated)" }}
      initial={false}
      animate={{ width: isOpen ? "var(--sidebar-expanded)" : "var(--sidebar-collapsed)" }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      {/* Header: Logo + Toggle */}
      <div className="flex items-center h-16 px-2.5 shrink-0">
        <motion.button
          type="button"
          onClick={toggle}
          whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center w-11 h-11 rounded-xl text-white/60 hover:text-white/90 transition-colors"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span
                key="collapse"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.15 }}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.span>
            ) : (
              <motion.span
                key="expand"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.15 }}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Logo text */}
        <AnimatePresence>
          {isOpen && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.05 }}
              className="ml-2 font-display text-xl text-white whitespace-nowrap overflow-hidden"
            >
              upNext
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Search input */}
      <div className="shrink-0 mb-4">
        <SidebarSearch onSearch={onSearch} collapsed={!isOpen} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none px-2.5 space-y-6">
        {/* DISCOVER section */}
        <SidebarSection title="Discover" collapsed={!isOpen}>
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                variants={navContainerVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="space-y-0.5"
              >
                <motion.div variants={navItemVariants}>
                  <SidebarNav
                    icon={Home}
                    label="Home"
                    active={false}
                    onClick={() => {}}
                    collapsed={!isOpen}
                  />
                </motion.div>

                <motion.div variants={navItemVariants}>
                  <SidebarNav
                    icon={Sparkles}
                    label="Surprise Me"
                    active={false}
                    onClick={handleSurpriseMe}
                    collapsed={!isOpen}
                  />
                </motion.div>

                {/* Categories toggle */}
                <motion.div variants={navItemVariants}>
                  <button
                    type="button"
                    onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                    className="
                      flex items-center justify-between w-full
                      px-3 py-2.5 rounded-lg text-sm font-medium
                      text-white/70 hover:text-white/90 hover:bg-white/[0.04]
                      transition-colors duration-200
                    "
                  >
                    <span className="flex items-center gap-3">
                      <Grid3X3 className="w-4 h-4" />
                      Categories
                    </span>
                    <motion.span
                      animate={{ rotate: categoriesExpanded ? 180 : 0 }}
                      transition={springConfigs.snappy}
                    >
                      <ChevronLeft className="w-3.5 h-3.5 rotate-[-90deg]" />
                    </motion.span>
                  </button>
                </motion.div>

                {/* Categories submenu */}
                <AnimatePresence>
                  {categoriesExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ ...springConfigs.snappy, opacity: { duration: 0.15 } }}
                      className="overflow-hidden pl-3"
                    >
                      <div className="space-y-0.5 py-1 border-l border-white/[0.06] pl-3">
                        {QUERY_CATEGORIES.map((category, index) => {
                          const Icon = ICON_MAP[category.icon];
                          return (
                            <motion.button
                              key={category.id}
                              type="button"
                              onClick={() => handleCategoryClick(category.id)}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ ...springConfigs.snappy, delay: index * 0.02 }}
                              whileHover={{ x: 2, backgroundColor: "rgba(255,255,255,0.04)" }}
                              whileTap={{ scale: 0.98 }}
                              className="
                                flex items-center gap-2 w-full
                                px-2 py-2 rounded-lg text-sm
                                text-white/50 hover:text-white/80
                                transition-colors duration-150
                              "
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {category.label}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed state icons */}
          {!isOpen && (
            <div className="flex flex-col items-center gap-1">
              <SidebarNav icon={Home} label="Home" collapsed onClick={() => {}} />
              <SidebarNav icon={Sparkles} label="Surprise Me" collapsed onClick={handleSurpriseMe} />
              <SidebarNav icon={Grid3X3} label="Categories" collapsed onClick={() => toggle()} />
            </div>
          )}
        </SidebarSection>

        {/* RECENT SEARCHES section */}
        <SidebarSection title="Recent Searches" collapsed={!isOpen}>
          <RecentSearches onSearchClick={onSearch} collapsed={!isOpen} />
        </SidebarSection>

        {/* Collapsed recent icon */}
        {!isOpen && (
          <div className="flex flex-col items-center">
            <SidebarNav icon={Clock} label="Recent" collapsed onClick={() => toggle()} />
          </div>
        )}
      </div>

      {/* Bottom spacer */}
      <div className="h-4 shrink-0" />
    </motion.aside>
  );
}

/**
 * Main sidebar component
 * Renders desktop sidebar or mobile drawer based on viewport
 */
export function Sidebar({ onSearch, onSurpriseMe, onCategorySelect }) {
  const { isOpen, close, isMobile } = useSidebar();

  // Mobile: render as slide-in drawer
  if (isMobile) {
    return (
      <MobileDrawer isOpen={isOpen} onClose={close}>
        {/* Mobile header */}
        <div className="flex items-center h-14 px-4 border-b border-white/[0.06]">
          <span className="font-display text-xl text-white">upNext</span>
        </div>

        <SidebarContent
          onSearch={onSearch}
          onSurpriseMe={onSurpriseMe}
          onCategorySelect={onCategorySelect}
          onClose={close}
          isExpanded={true}
        />
      </MobileDrawer>
    );
  }

  // Desktop: render fixed sidebar
  return (
    <DesktopSidebar
      onSearch={onSearch}
      onSurpriseMe={onSurpriseMe}
      onCategorySelect={onCategorySelect}
    />
  );
}
