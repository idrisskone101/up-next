import { forwardRef, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverAnchor } from "./ui/popover";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "./ui/drawer";
import { Command, CommandList, CommandItem, CommandEmpty } from "./ui/command";
import { useTitleSearch } from "../hooks/useTitleSearch";
import { haptics } from "../lib/haptics";
import {
  mentionDropdownVariants,
  prefersReducedMotion,
} from "../lib/animations";

const POSTER_BASE = "https://image.tmdb.org/t/p/w92";

/**
 * Skeleton loader with shimmer effect
 */
function SkeletonItem({ isMobile = false }) {
  return (
    <div
      className={`flex items-center gap-3 mx-1.5 ${
        isMobile ? "min-h-[48px] px-3 py-3" : "px-2.5 py-2.5"
      }`}
    >
      {/* Poster skeleton */}
      <div
        className={`rounded bg-gray-100 shrink-0 animate-pulse ${
          isMobile ? "w-10 h-[60px]" : "w-9 h-[54px]"
        }`}
      />
      {/* Text skeleton */}
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Mention dropdown for @title search
 * Selection state lifted to parent for keyboard navigation
 * Desktop: Popover, Mobile: Vaul Drawer (handles keyboard automatically)
 */
export const MentionDropdown = forwardRef(function MentionDropdown(
  { anchorRef, triggerInfo, onSelect, onClose, selectedIndex = 0, onResultsChange },
  ref
) {
  const reducedMotion = prefersReducedMotion();
  const listRef = useRef(null);
  const drawerInputRef = useRef(null);

  // Simple mobile detection (width < 768)
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  // Drawer-local search state for mobile
  const [drawerSearchText, setDrawerSearchText] = useState('');

  // Determine which search text to use
  const activeSearchText = isMobile ? drawerSearchText : triggerInfo.searchText;
  const { results, loading } = useTitleSearch(activeSearchText);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isOpen = triggerInfo.active;

  // Seed drawer input when drawer opens on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      setDrawerSearchText(triggerInfo.searchText || '');
      // Focus the drawer input after a brief delay for drawer animation
      // preventScroll stops iOS from scrolling page to drawer
      setTimeout(() => {
        drawerInputRef.current?.focus({ preventScroll: true });
      }, 100);
    }
  }, [isMobile, isOpen, triggerInfo.searchText]);

  // Report results to parent for keyboard navigation
  useEffect(() => {
    onResultsChange?.(results);
  }, [results, onResultsChange]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[cmdk-item]');
    const selectedItem = items?.[selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  const getYear = (dateStr) => {
    if (!dateStr) return "";
    return dateStr.split("-")[0];
  };

  // Handle selection with haptic feedback
  const handleSelect = (title) => {
    haptics.medium();
    onSelect(title);
  };

  // Shared dropdown content renderer
  const renderDropdownContent = (isMobileView = false) => (
    <Command
      className="bg-transparent"
      shouldFilter={false}
      loop
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <CommandList
        ref={listRef}
        className={`scrollbar-thin scrollbar-thumb-brand-golden/30 scrollbar-track-transparent overflow-x-hidden ${
          loading ? "overflow-hidden" : ""
        } ${isMobileView ? "h-full overflow-y-auto" : "h-[222px] max-h-[222px]"}`}
      >
        {/* Loading state - skeleton shimmer */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SkeletonItem isMobile={isMobileView} />
              <SkeletonItem isMobile={isMobileView} />
              <SkeletonItem isMobile={isMobileView} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!loading && results.length === 0 && (
          <CommandEmpty className="px-4 py-6 text-center text-sm text-gray-500">
            {activeSearchText
              ? `No titles found for "${activeSearchText}"`
              : "Type to search titles..."}
          </CommandEmpty>
        )}

        {/* Results */}
        {!loading &&
          results.length > 0 &&
          results.map((title, index) => {
            const isSelected = index === selectedIndex;
            return (
              <CommandItem
                key={title.id}
                value={title.id.toString()}
                onSelect={() => handleSelect(title)}
                data-selected={isSelected}
                className={`flex items-center gap-3 cursor-pointer rounded-lg mx-1.5 transition-colors duration-150 ${
                  isMobileView ? "min-h-[48px] px-3 py-3" : "px-2.5 py-2.5"
                } ${
                  isSelected
                    ? "bg-brand-golden/25 border border-brand-golden/40 shadow-sm"
                    : "hover:bg-gray-100 border border-transparent"
                }`}
              >
                {/* Poster thumbnail */}
                <div className="shrink-0">
                  {title.poster_path ? (
                    <img
                      src={`${POSTER_BASE}${title.poster_path}`}
                      alt=""
                      className={`rounded object-cover bg-gray-100 ${
                        isMobileView ? "w-10 h-[60px]" : "w-9 h-[54px]"
                      }`}
                    />
                  ) : (
                    <div
                      className={`rounded bg-gray-100 flex items-center justify-center ${
                        isMobileView ? "w-10 h-[60px]" : "w-9 h-[54px]"
                      }`}
                    >
                      <span className="text-gray-400 text-xs">?</span>
                    </div>
                  )}
                </div>

                {/* Title info */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-medium truncate ${
                      isMobileView ? "text-base" : "text-sm"
                    } ${isSelected ? "text-gray-900" : "text-gray-800"}`}
                  >
                    {title.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">
                      {getYear(title.release_date)}
                    </span>
                    {/* Type badge */}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        title.kind === "tv"
                          ? "bg-violet-100 text-violet-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {title.kind === "tv" ? "TV" : "Movie"}
                    </span>
                  </div>
                </div>
              </CommandItem>
            );
          })}
      </CommandList>
    </Command>
  );

  // Handle drawer open change with haptic feedback
  const handleDrawerOpenChange = (open) => {
    if (open) {
      haptics.light();
    }
    if (!open) {
      onClose();
    }
  };

  // Mobile: Vaul Drawer (auto keyboard handling)
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleDrawerOpenChange}>
        <DrawerContent
          ref={ref}
          className="h-[70dvh] rounded-t-2xl bg-white border-t border-gray-200 focus:outline-none"
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Screen reader title */}
            <DrawerTitle className="sr-only">Select a title</DrawerTitle>
            <DrawerDescription className="sr-only">
              Search results for @mentions
            </DrawerDescription>

            {/* Handle bar */}
            <div className="flex justify-center py-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Drawer search input */}
            <div className="px-4 pb-3 pt-1 shrink-0">
              <input
                ref={drawerInputRef}
                type="text"
                value={drawerSearchText}
                onChange={(e) => setDrawerSearchText(e.target.value)}
                placeholder="Search titles..."
                className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-golden/50 focus:border-brand-golden/50 focus:bg-white transition-all"
              />
            </div>

            {/* Results list - scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {renderDropdownContent(true)}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Popover
  return (
    <Popover open={isOpen}>
      <PopoverAnchor asChild>
        <span ref={anchorRef} className="absolute left-0 right-0 bottom-0" />
      </PopoverAnchor>

      <AnimatePresence mode="wait">
        {isOpen && (
          <PopoverContent
            ref={ref}
            asChild
            side="bottom"
            align="start"
            sideOffset={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="p-0 border-0 shadow-none w-[min(360px,calc(100vw-2rem))]"
          >
            <motion.div
              variants={reducedMotion ? {} : mentionDropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white overflow-hidden border border-gray-200 rounded-xl shadow-xl shadow-gray-200/50"
            >
              {renderDropdownContent(false)}
            </motion.div>
          </PopoverContent>
        )}
      </AnimatePresence>
    </Popover>
  );
});
