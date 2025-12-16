import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, X } from "lucide-react";
import { Spinner } from "./ui/spinner";

const EXAMPLE_QUERIES = [
  "Movies that make you ugly cry",
  "Cozy rainy day vibes",
  "Mind-bending plot twists",
  "90s nostalgia trip",
  "Feel-good underdog stories",
  "Existential crisis at 2am",
  "Heist movies but make it funny",
  "Visually stunning cinematography",
  "Slow-burn psychological horror",
  "Enemies to lovers romcoms",
  "Time loop paradoxes",
  "Gritty noir detective stories"
];

const chipVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.1 }
  }
};

export function HeroSearchCard({ onSearch, loading }) {
  const [query, setQuery] = useState("");
  const [moviesEnabled, setMoviesEnabled] = useState(false);
  const [tvEnabled, setTvEnabled] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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

        {/* Example Queries */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-2 px-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <span className="text-xs text-white/35 mr-1">Try:</span>
          {EXAMPLE_QUERIES.map((example, index) => (
            <motion.button
              key={example}
              variants={chipVariants}
              type="button"
              onClick={() => handleExampleClick(example)}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-xs px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.03] text-white/45 hover:bg-white/10 hover:text-white/70 hover:border-white/15 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {example}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
