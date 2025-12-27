import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, X, Sparkles, Heart, Skull, Brain, Popcorn, Moon, Flame, Clock } from "lucide-react";
import { Spinner } from "./ui/spinner";
import { QUERY_CATEGORIES } from "../lib/categories";

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

export function HeroSearchCard({ onSearch, loading }) {
  const [query, setQuery] = useState("");
  const [moviesEnabled, setMoviesEnabled] = useState(false);
  const [tvEnabled, setTvEnabled] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState("vibes");
  const textareaRef = useRef(null);
  const categoryScrollRef = useRef(null);
  const queryScrollRef = useRef(null);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      textareaRef.current?.focus();
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [query]);

  const getKindFilter = () => {
    if (moviesEnabled && !tvEnabled) return ["movie"];
    if (tvEnabled && !moviesEnabled) return ["tv"];
    return null;
  };

  const handleSubmit = (event) => {
    event?.preventDefault();
    if (query.trim()) {
      textareaRef.current?.blur();
      onSearch(query.trim(), getKindFilter());
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
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
    textareaRef.current?.focus();
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
      <div className="space-y-5">
        {/* Main Search Card */}
        <motion.div
          className="relative overflow-hidden rounded-[1.75rem] bg-black/50 backdrop-blur-2xl border"
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
          <div className="px-5 pt-5 pb-3 sm:px-7 sm:pt-7 sm:pb-4">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="I want something cozy but not corny, like Before Sunrise vibes..."
                disabled={loading}
                rows={1}
                className="w-full resize-none bg-transparent text-lg sm:text-xl text-white placeholder:text-white/25 focus:outline-none disabled:opacity-50 font-medium leading-relaxed pr-10"
                style={{ minHeight: "56px", maxHeight: "150px" }}
              />

              {/* Clear button - animated enter/exit */}
              <AnimatePresence>
                {query && !loading && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    type="button"
                    onClick={handleClear}
                    className="absolute right-0 top-1 flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                )}
              </AnimatePresence>
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
              disabled={loading || !query.trim()}
              whileHover={{ scale: 1.08, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/25 transition-shadow duration-300 hover:shadow-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-amber-500/25"
              aria-label="Search"
            >
              {loading ? (
                <Spinner size={20} className="text-white" ariaLabel="Searching..." />
              ) : (
                <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
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
              {QUERY_CATEGORIES.find(c => c.id === activeCategory)?.queries.map((q, idx) => (
                <motion.button
                  key={q}
                  type="button"
                  onClick={() => handleExampleClick(q)}
                  disabled={loading}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02, duration: 0.15 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] text-white/60 hover:text-white/90 hover:border-white/15 hover:from-white/[0.1] hover:to-white/[0.04] hover:shadow-lg hover:shadow-black/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {q}
                </motion.button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
