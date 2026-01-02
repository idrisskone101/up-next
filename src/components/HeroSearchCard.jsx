import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { ArrowUp, X, Sparkles, Heart, Skull, Brain, Popcorn, Moon, Flame, Clock } from "lucide-react";
import { Spinner } from "./ui/spinner";
import { QUERY_CATEGORIES } from "../lib/categories";
import { useMentions } from "../hooks/useMentions";
import { MentionDropdown } from "./MentionDropdown";
import { MentionChip } from "./MentionChip";
import { submitReadyPulse, prefersReducedMotion } from "../lib/animations";

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

export function HeroSearchCard({ onSearch, onSimilarSearch, loading }) {
  const [query, setQuery] = useState("");
  const [moviesEnabled, setMoviesEnabled] = useState(false);
  const [tvEnabled, setTvEnabled] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState("vibes");
  const textareaRef = useRef(null);
  const categoryScrollRef = useRef(null);
  const queryScrollRef = useRef(null);
  const dropdownAnchorRef = useRef(null);
  const submitButtonControls = useAnimationControls();
  const reducedMotion = prefersReducedMotion();

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
  const [dropdownSelectedIndex, setDropdownSelectedIndex] = useState(0);
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
      setDropdownSelectedIndex(0);
    }
    prevActiveRef.current = triggerInfo.active;
  }, [triggerInfo.active]);

  // Always select first result when results update (prevents flickering)
  useEffect(() => {
    if (dropdownResults.length > 0) {
      setDropdownSelectedIndex(0);
    }
  }, [dropdownResults]);

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
      onSimilarSearch?.(mention.id, getKindFilter());
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
      if (event.key === 'Enter' && dropdownResults.length > 0) {
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
    setQuery(exampleQuery);
    onSearch(exampleQuery, getKindFilter());
  };

  const handleClear = () => {
    setQuery("");
    resetMentions();
    textareaRef.current?.focus();
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
      <div className="space-y-5">
        {/* Main Search Card */}
        <motion.div
          className={`relative overflow-hidden rounded-[1.75rem] bg-black/50 backdrop-blur-2xl border orbit-border ${isFocused ? 'focused' : ''}`}
          animate={{
            boxShadow: isFocused
              ? "0 0 40px rgba(245,158,11,0.15), 0 25px 50px -12px rgba(0,0,0,0.5)"
              : "0 25px 50px -12px rgba(0,0,0,0.25)",
            borderColor: isFocused
              ? "rgba(245,158,11,0.4)"
              : "rgba(255,255,255,0.08)"
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Textarea Area */}
          <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4">
            {/* Mention Chip - shown above textarea when selected */}
            <AnimatePresence mode="wait">
              {hasMention && mention && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    opacity: { duration: 0.15 },
                  }}
                  className="overflow-hidden"
                >
                  <MentionChip mention={mention} onRemove={clearMention} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative" ref={dropdownAnchorRef}>
              <textarea
                ref={textareaRef}
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={hasMention ? "Press enter to find similar titles..." : "Describe a vibe or type @title..."}
                disabled={loading}
                rows={1}
                className="h-12 w-full resize-none bg-transparent text-base sm:text-lg text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50 font-medium leading-tight pr-10"
              />

              {/* Clear button - animated enter/exit */}
              <AnimatePresence>
                {(query || hasMention) && !loading && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    type="button"
                    onClick={handleClear}
                    className="absolute right-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
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

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between px-5 pb-5 sm:px-7 sm:pb-7">
            {/* Filter Toggles */}
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                onClick={handleToggleMovies}
                whileTap={{ scale: 0.95 }}
                className={`h-8 rounded-full border px-3.5 text-sm font-medium transition-colors duration-200 ${
                  moviesEnabled
                    ? "border-amber-500/50 bg-amber-500/15 text-amber-400"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 hover:border-white/15"
                }`}
              >
                Movies
              </motion.button>
              <motion.button
                type="button"
                onClick={handleToggleTV}
                whileTap={{ scale: 0.95 }}
                className={`h-8 rounded-full border px-3.5 text-sm font-medium transition-colors duration-200 ${
                  tvEnabled
                    ? "border-amber-500/50 bg-amber-500/15 text-amber-400"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 hover:border-white/15"
                }`}
              >
                TV Shows
              </motion.button>
            </div>

            {/* Submit Button */}
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={loading || (!query.trim() && !hasMention)}
              animate={submitButtonControls}
              whileHover={{ scale: 1.08, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 ${
                hasMention
                  ? "bg-amber-500/15 border border-amber-500/40 text-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.2)]"
                  : "bg-white/[0.06] border border-amber-500/25 text-white/85"
              } hover:bg-amber-500/12 hover:border-amber-500/40 hover:text-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] active:bg-amber-500/20 active:border-amber-500/50 active:text-amber-300 disabled:bg-white/[0.03] disabled:border-white/[0.05] disabled:text-white/30 disabled:cursor-not-allowed disabled:shadow-none`}
              aria-label={hasMention ? "Find similar" : "Search"}
            >
              {loading ? (
                <Spinner size={20} className="text-white" ariaLabel="Searching..." />
              ) : (
                <motion.div
                  animate={hasMention ? { rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
                </motion.div>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Query Categories - Mobile-first horizontal scroll */}
        <div className="space-y-3">
          {/* Category Tabs */}
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
                    setActiveCategory(category.id);
                    // Reset query scroll position when category changes
                    if (queryScrollRef.current) {
                      queryScrollRef.current.scrollLeft = 0;
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 snap-start shrink-0 ${
                    isActive
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                      : "bg-white/[0.03] text-white/40 border border-white/5 hover:bg-white/[0.06] hover:text-white/60"
                  }`}
                >
                  <motion.span
                    animate={isActive ? { rotate: [0, -10, 10, 0] } : { rotate: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </motion.span>
                  <span>{category.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Query Pills - Horizontal scroll */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
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
                  className="px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] text-white/60 hover:text-white/90 hover:border-white/15 hover:from-white/[0.1] hover:to-white/[0.04] hover:shadow-lg hover:shadow-black/20 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
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
