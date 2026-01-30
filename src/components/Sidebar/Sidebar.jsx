import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Sparkles,
  Grid3X3,
  Heart,
  Flame,
  Brain,
  Skull,
  Popcorn,
  Moon,
  Clock
} from "lucide-react";
import { useSidebar } from "../../contexts/SidebarContext";
import { QUERY_CATEGORIES, getRandomQuery } from "../../lib/categories";
import { springConfigs, listContainerVariants, listItemVariants } from "../../lib/animations";
import { SidebarNav } from "./SidebarNav";
import { SidebarSection } from "./SidebarSection";
import { RecentSearches } from "./RecentSearches";
import { MobileDrawer } from "./MobileDrawer";
import { UpNextLogo } from "../ui/UpNextLogo";

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
function SidebarContent({ onSearch, onSurpriseMe, onCategorySelect, onHome, onClose, isExpanded = true }) {
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  const handleSurpriseMe = () => {
    const query = getRandomQuery();
    onSurpriseMe?.(query);
    onClose?.();
  };

  const handleCategoryClick = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleQueryClick = (query) => {
    onCategorySelect?.(query);
    onClose?.();
  };

  return (
    <>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none px-4 space-y-4 pb-4">
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
                      onHome?.();
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
                      text-white/70 hover:text-brand-golden hover:bg-white/10
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
                      <div className="space-y-0.5 py-1 border-l border-brand-golden/30 pl-3">
                        {QUERY_CATEGORIES.map((category, index) => {
                          const Icon = ICON_MAP[category.icon];
                          const isExpanded = expandedCategory === category.id;
                          return (
                            <div key={category.id}>
                              <motion.button
                                type="button"
                                onClick={() => handleCategoryClick(category.id)}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ ...springConfigs.snappy, delay: index * 0.02 }}
                                whileHover={{ x: 2, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                                whileTap={{ scale: 0.98 }}
                                className="
                                  flex items-center justify-between w-full
                                  px-2 py-2 rounded-lg text-sm
                                  text-white/60 hover:text-brand-golden
                                  transition-colors duration-150
                                  min-h-[44px]
                                "
                              >
                                <span className="flex items-center gap-2">
                                  <Icon className="w-3.5 h-3.5" />
                                  {category.label}
                                </span>
                                <motion.span
                                  animate={{ rotate: isExpanded ? 90 : 0 }}
                                  transition={springConfigs.snappy}
                                >
                                  <ChevronRight className="w-3 h-3" />
                                </motion.span>
                              </motion.button>

                              {/* Query submenu */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    variants={listContainerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="ml-4 pl-3 border-l border-white/10 py-1 space-y-0.5"
                                  >
                                    {category.queries.map((query) => (
                                      <motion.button
                                        key={query}
                                        variants={listItemVariants}
                                        type="button"
                                        onClick={() => handleQueryClick(query)}
                                        whileHover={{ x: 2, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                                        whileTap={{ scale: 0.98 }}
                                        className="
                                          block w-full text-left
                                          px-2 py-2 rounded-lg text-xs
                                          text-white/50 hover:text-brand-golden
                                          transition-colors duration-150
                                          min-h-[44px] flex items-center
                                        "
                                      >
                                        {query}
                                      </motion.button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
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
    </>
  );
}

/**
 * Main sidebar component
 * Always renders as drawer overlay (unified mobile/desktop pattern)
 */
export function Sidebar({ onSearch, onSurpriseMe, onCategorySelect, onHome }) {
  const { isOpen, close } = useSidebar();

  return (
    <MobileDrawer isOpen={isOpen} onClose={close} logo={<UpNextLogo size="md" variant="light" />}>
      <SidebarContent
        onSearch={onSearch}
        onSurpriseMe={onSurpriseMe}
        onCategorySelect={onCategorySelect}
        onHome={onHome}
        onClose={close}
        isExpanded={true}
      />
    </MobileDrawer>
  );
}
