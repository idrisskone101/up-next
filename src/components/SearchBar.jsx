import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Paperclip, AudioLines, ArrowUp, X } from "lucide-react";
import { Spinner } from "./ui/spinner";
import { haptics } from "../lib/haptics";

const EXAMPLE_QUERIES = [
  "Movies that make you ugly cry",
  "Cozy rainy day vibes",
  "Mind-bending plot twists",
  "90s nostalgia trip",
  "Feel-good underdog stories",
  "Existential crisis at 2am",
  "Heist movies but make it funny",
  "Visually stunning cinematography",
  "Cyberpunk anime classics",
  "Slow-burn psychological horror",
  "Enemies to lovers romcoms",
  "Time loop paradoxes",
  "Space operas with epic battles",
  "Whodunnit mysteries",
  "Studio Ghibli magic",
  "Gritty noir detective stories"
];

/**
 * Lovable-inspired search bar with card-style design
 */
export function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState("");
  const [moviesEnabled, setMoviesEnabled] = useState(false);
  const [tvEnabled, setTvEnabled] = useState(false);
  const textareaRef = useRef(null);

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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
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
      haptics.medium();
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
    haptics.light();
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
    haptics.light();
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
    haptics.light();
    setQuery(exampleQuery);
    onSearch(exampleQuery, getKindFilter());
  };

  return (
    <div className="mx-auto w-full max-w-3xl sm:px-6">
      <div className="space-y-4">
        {/* Main Search Card */}
        <div className="lovable-card transition-all duration-300 border border-white/10 focus-within:border-orange-500/50 focus-within:shadow-2xl focus-within:shadow-orange-500/10">
          {/* Textarea Area */}
          <div className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-3">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask upNext to find a movie about..."
              disabled={loading}
              rows={1}
              className="w-full resize-none bg-transparent text-lg sm:text-2xl text-white placeholder:text-white/20 focus:outline-none disabled:opacity-50 font-medium tracking-wide"
              style={{ minHeight: "40px", maxHeight: "200px" }}
            />
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between px-4 pb-4 sm:px-6 sm:pb-6">
            {/* Left Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition-all hover:bg-white/10 hover:text-white"
                aria-label="Add context"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition-all hover:bg-white/10 hover:text-white"
                aria-label="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition-all hover:bg-white/10 hover:text-white"
                aria-label="Voice input"
              >
                <AudioLines className="h-4 w-4" />
              </button>
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !query.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] border border-amber-500/25 text-white/85 transition-all duration-200 hover:bg-amber-500/12 hover:border-amber-500/40 hover:text-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] active:bg-amber-500/20 active:border-amber-500/50 active:text-amber-300 active:shadow-[inset_0_0_12px_rgba(245,158,11,0.25)] disabled:bg-white/[0.03] disabled:border-white/[0.05] disabled:text-white/30 disabled:cursor-not-allowed disabled:shadow-none"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                aria-label="Search"
              >
                {loading ? (
                  <Spinner size={20} className="text-white" ariaLabel="Searching..." />
                ) : (
                  <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Filter Toggles */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleToggleMovies}
            className={`h-9 rounded-full border px-4 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
              moviesEnabled
                ? "border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20"
            }`}
          >
            Movies
          </button>
          <button
            type="button"
            onClick={handleToggleTV}
            className={`h-9 rounded-full border px-4 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
              tvEnabled
                ? "border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20"
            }`}
          >
            TV Shows
          </button>
        </div>

        {/* Example Queries */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 px-2 sm:px-0 max-h-[84px] overflow-y-auto mask-image-gradient scrollbar-none">
          <span className="text-xs text-white/40 mr-1 sticky left-0">Try:</span>
          {EXAMPLE_QUERIES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleExampleClick(example)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.03] text-white/50 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
