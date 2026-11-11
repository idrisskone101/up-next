import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { ArrowUp, X, Sparkles, Heart, Skull, Brain, Popcorn, Moon, Flame, Clock } from "lucide-react";
import { Spinner } from "./ui/spinner";
import { QUERY_CATEGORIES } from "../lib/categories";
import { useMentions } from "../hooks/useMentions";
import { MentionDropdown } from "./MentionDropdown";
import { MentionChip } from "./MentionChip";
import { submitReadyPulse, prefersReducedMotion, springConfigs } from "../lib/animations";
import * as analytics from "../lib/analytics";

// Icon map for dynamic icon lookup
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

// Rotating placeholder examples for the search input
const PLACEHOLDER_EXAMPLES = [
  "Describe a vibe or type @title...",
  "Cozy rainy day movies...",
  "Mind-bending sci-fi like Inception...",
  "Feel-good 90s nostalgia...",
  "Dark but beautiful films...",
];

export function HeroSearchCard({ onSearch, onSimilarSearch, loading }) {
  const [query, setQuery] = useState("");
  const [moviesEnabled, setMoviesEnabled] = useState(false);
  const [tvEnabled, setTvEnabled] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState("vibes");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const textareaRef = useRef(null);
  const categoryScrollRef = useRef(null);
  const queryScrollRef = useRef(null);
  const dropdownAnchorRef = useRef(null);
  const submitButtonControls = useAnimationControls();
  const reducedMotion = prefersReducedMotion();

  // Rotate placeholder text every 4 seconds when not focused and no query
  useEffect(() => {
    if (isFocused || query.length > 0 || reducedMotion) return;

    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isFocused, query, reducedMotion]);

  // Mention state
  const {
    mention,
    triggerInfo,
    hasMention,
    detectTrigger,
    setMention,
    clearMention,
    closeTrigger,
    resetMentions,
  } = useMentions();

  // Dropdown keyboard navigation state (lifted from MentionDropdown)
  const [dropdownSelectedIndex, setDropdownSelectedIndex] = useState(-1);
  const [dropdownResults, setDropdownResults] = useState([]);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      textareaRef.current?.focus();
    }
  }, []);

  // Pulse submit button when mention is selected (ready state)
  useEffect(() => {
    if (hasMention && !reducedMotion) {
      submitButtonControls.start(submitReadyPulse);
    }
  }, [hasMention, submitButtonControls, reducedMotion]);

  // Reset dropdown selection when dropdown opens or results change
  const prevActiveRef = useRef(false);
  useEffect(() => {
    if (triggerInfo.active && !prevActiveRef.current) {
      setDropdownSelectedIndex(-1);
    }
    prevActiveRef.current = triggerInfo.active;
  }, [triggerInfo.active]);


  const getKindFilter = () => {
    if (moviesEnabled && !tvEnabled) return ["movie"];
    if (tvEnabled && !moviesEnabled) return ["tv"];
    return null;
  };

  const handleSubmit = (event) => {
    event?.preventDefault();
    textareaRef.current?.blur();

    // If mention exists, use similar search
    if (hasMention && mention) {
      onSimilarSearch?.(mention.id, mention.kind, getKindFilter(), mention.title);
      return;
    }

    // Regular search
    if (query.trim()) {
      onSearch(query.trim(), getKindFilter());
    }
  };

  const handleKeyDown = (event) => {
    // Handle dropdown navigation when active
    if (triggerInfo.active && triggerInfo.searchText.length >= 1) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setDropdownSelectedIndex(prev => Math.min(prev + 1, dropdownResults.length - 1));
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setDropdownSelectedIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (event.key === 'Enter' && dropdownResults.length > 0 && dropdownSelectedIndex >= 0) {
        event.preventDefault();
        handleMentionSelect(dropdownResults[dropdownSelectedIndex]);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        resetMentions();
        return;
      }
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  // Handle text input change with mention detection
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    detectTrigger(newValue, e.target.selectionStart);
  };

  // Handle mention selection from dropdown
  const handleMentionSelect = (title) => {
    analytics.trackMentionSelected({ titleId: title.id, titleName: title.title });
    setMention({
      id: title.id,
      title: title.title,
      poster_path: title.poster_path,
      kind: title.kind,
    });
    // Clear the @query text from the input
    const beforeAt = query.slice(0, triggerInfo.startIndex);
    const afterQuery = query.slice(triggerInfo.startIndex + 1 + triggerInfo.searchText.length);
    setQuery(beforeAt + afterQuery);
    textareaRef.current?.focus();
  };

  // Close dropdown (keep text and input focused)
  const handleDropdownClose = () => {
    closeTrigger();
  };

  const handleToggleMovies = () => {
    const newMoviesEnabled = !moviesEnabled;
    setMoviesEnabled(newMoviesEnabled);
    if (query.trim()) {
      let newFilter = null;
      if (newMoviesEnabled && !tvEnabled) newFilter = ["movie"];
      else if (!newMoviesEnabled && tvEnabled) newFilter = ["tv"];
      onSearch(query.trim(), newFilter);
    }
  };

  const handleToggleTV = () => {
    const newTvEnabled = !tvEnabled;
    setTvEnabled(newTvEnabled);
    if (query.trim()) {
      let newFilter = null;
      if (!moviesEnabled && newTvEnabled) newFilter = ["tv"];
      else if (moviesEnabled && !newTvEnabled) newFilter = ["movie"];
      onSearch(query.trim(), newFilter);
    }
  };

  const handleExampleClick = (exampleQuery) => {
    analytics.trackQueryPillClicked({ queryText: exampleQuery, categoryId: activeCategory });
    setQuery(exampleQuery);
    onSearch(exampleQuery, getKindFilter());
  };

  const handleClear = () => {
    setQuery("");
    resetMentions();
    textareaRef.current?.focus();
  };

  // Check if search is ready (has content)
  const isReady = query.trim().length > 0 || hasMention;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
      <div className="space-y-5">
        {/* Main Search Card - Enhanced Warm Cinema Glow */}
        <motion.div
          className="relative overflow-hidden rounded-[2rem]"
          animate={{
            boxShadow: isFocused
              ? "0 0 0 3px rgba(238,199,69,0.2), 0 8px 40px -8px rgba(238,199,69,0.25), 0 20px 50px -15px rgba(0,0,0,0.1)"
              : isReady
                ? "0 0 30px rgba(238,199,69,0.15), 0 8px 40px -8px rgba(0,0,0,0.1)"
                : "0 8px 40px -8px rgba(0,0,0,0.08)"
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Clean white background - Cinema Spotlight */}
          <div className="absolute inset-0 bg-white" />

          {/* Subtle noise texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Border - subtle gray idle, golden on focus */}
          <motion.div
            className="absolute inset-0 rounded-[2rem] pointer-events-none"
            animate={{
              boxShadow: isFocused
                ? "inset 0 0 0 2px rgba(238,199,69,0.5)"
                : isReady
                  ? "inset 0 0 0 1.5px rgba(238,199,69,0.35)"
                  : "inset 0 0 0 1px rgba(0,0,0,0.06)"
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Input Area - Badge OR Textarea */}
          <div className="relative px-4 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
            <div className="relative flex items-center min-h-[48px]" ref={dropdownAnchorRef}>
              <AnimatePresence mode="wait">
                {hasMention && mention ? (
                  /* Inline mention badge - replaces textarea when title selected */
                  <MentionChip
                    key="badge"
                    mention={mention}
                    onRemove={clearMention}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        handleSubmit();
                      }
                    }}
                  />
                ) : (
                  /* Normal textarea input - Enhanced with warm styling */
                  <motion.div
                    key="input-container"
                    className="flex items-center gap-3 w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <textarea
                      ref={textareaRef}
                      value={query}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Describe a vibe or type @title..."
                      disabled={loading}
                      rows={1}
                      className="h-12 w-full resize-none bg-transparent text-base sm:text-lg text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:opacity-50 font-medium leading-tight pr-10"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Clear button - only show for textarea (badge has its own X) */}
              <AnimatePresence>
                {query && !hasMention && !loading && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    type="button"
                    onClick={handleClear}
                    className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Dropdown anchor */}
              <MentionDropdown
                anchorRef={dropdownAnchorRef}
                triggerInfo={triggerInfo}
                onSelect={handleMentionSelect}
                onClose={handleDropdownClose}
                selectedIndex={dropdownSelectedIndex}
                onResultsChange={setDropdownResults}
              />
            </div>
          </div>

          {/* Bottom Action Bar - Enhanced */}
          <div className="relative flex items-center justify-between px-5 pb-5 sm:px-7 sm:pb-7">
            {/* Filter Toggles - Warm cream tones */}
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                onClick={handleToggleMovies}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`h-9 rounded-full border px-4 text-sm font-semibold transition-all duration-200 ${
                  moviesEnabled
                    ? "bg-brand-golden text-[#481B13] border-brand-golden shadow-[0_0_16px_rgba(238,199,69,0.35)]"
                    : "bg-brand-cream/20 border-brand-cream/40 text-gray-600 hover:bg-brand-cream/30 hover:text-gray-800 hover:border-brand-golden/30"
                }`}
              >
                Movies
              </motion.button>
              <motion.button
                type="button"
                onClick={handleToggleTV}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`h-9 rounded-full border px-4 text-sm font-semibold transition-all duration-200 ${
                  tvEnabled
                    ? "bg-brand-golden text-[#481B13] border-brand-golden shadow-[0_0_16px_rgba(238,199,69,0.35)]"
                    : "bg-brand-cream/20 border-brand-cream/40 text-gray-600 hover:bg-brand-cream/30 hover:text-gray-800 hover:border-brand-golden/30"
                }`}
              >
                TV Shows
              </motion.button>
            </div>

            {/* Submit Button - Golden */}
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={loading || (!query.trim() && !hasMention)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                isReady && !loading
                  ? "bg-brand-golden text-gray-900 shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              aria-label={hasMention ? "Find similar" : "Search"}
            >
              {loading ? (
                <Spinner size={22} className="text-gray-900" ariaLabel="Searching..." />
              ) : (
                <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Query Categories - Enhanced with colorful themes */}
        <div className="space-y-3">
          {/* Category Tabs - Each gets its personality */}
          <div
            ref={categoryScrollRef}
            className="flex gap-2 overflow-x-auto scrollbar-none px-1 pb-1 -mx-1 scroll-smooth snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {QUERY_CATEGORIES.map((category) => {
              const Icon = ICON_MAP[category.icon];
              const isActive = activeCategory === category.id;

              return (
                <motion.button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    analytics.trackCategorySelected({ categoryId: category.id, categoryLabel: category.label });
                    setActiveCategory(category.id);
                    // Reset query scroll position when category changes
                    if (queryScrollRef.current) {
                      queryScrollRef.current.scrollLeft = 0;
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap snap-start shrink-0 transition-all duration-200 ${
                    isActive
                      ? "bg-brand-red text-white shadow-md"
                      : "bg-white/80 text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Query Pills - Smooth crossfade */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              ref={queryScrollRef}
              className="flex gap-2 overflow-x-auto scrollbar-none px-1 pb-2 -mx-1 scroll-smooth"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {QUERY_CATEGORIES.find(c => c.id === activeCategory)?.queries.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleExampleClick(q)}
                  disabled={loading}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap shrink-0
                    bg-white border border-gray-200 text-gray-600
                    hover:bg-brand-red hover:border-brand-red hover:text-white hover:shadow-md
                    active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all duration-200`}
                >
                  {q}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
