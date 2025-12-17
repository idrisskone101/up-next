import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { AlertCircle, ArrowUp, X, ArrowLeft } from "lucide-react";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Spinner } from "./components/ui/spinner";
import { SkeletonCard } from "./components/SkeletonCard";
import { EmptyState } from "./components/EmptyState";
import { ResultsGrid } from "./components/ResultsGrid";
import { HeroSearchCard } from "./components/HeroSearchCard";
import { useSearch } from "./hooks/useSearch";
import { springConfigs } from "./lib/animations";
import { haptics } from "./lib/haptics";

const pageTransition = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1]
};

function App() {
  const { results, loading, loadingMore, refreshing, error, searchMetadata, hasMore, search, loadMore, refresh, reset } = useSearch();
  const [compactQuery, setCompactQuery] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const compactInputRef = useRef(null);
  const { scrollY } = useScroll();

  const hasResults = results.length > 0;
  const hasSearched = !!searchMetadata;
  const viewState = hasResults || loading || error || (hasSearched && results.length === 0) ? "results" : "hero";

  // Track scroll position for back-to-top button
  useMotionValueEvent(scrollY, "change", (latest) => {
    setShowBackToTop(latest > 400);
  });

  // Sync compact input with search query
  useEffect(() => {
    if (searchMetadata?.query) {
      setCompactQuery(searchMetadata.query);
    }
  }, [searchMetadata?.query]);

  const handleSearch = (query, kindFilter) => {
    setCompactQuery(query);
    search(query, 80, 0, kindFilter);
  };

  const handleCompactSubmit = (e) => {
    e?.preventDefault();
    if (compactQuery.trim()) {
      search(compactQuery.trim(), 80, 0, null);
    }
  };

  const handleBackToHero = () => {
    reset();
    setCompactQuery("");
  };

  const handleBackToTop = () => {
    haptics.light();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`relative min-h-dvh ${viewState === "hero" ? "h-dvh overflow-hidden" : ""}`}>
      {/* Sticky Nav - Only render when showing results */}
      {viewState === "results" && (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]">

        <div className="container flex h-16 items-center gap-4 px-4 sm:px-6">
          {/* Back Button */}
          <motion.button
            type="button"
            onClick={handleBackToHero}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Back to search"
          >
            <ArrowLeft className="h-4 w-4" />
          </motion.button>

          {/* Logo */}
          <button
            type="button"
            onClick={handleBackToHero}
            className="font-display text-2xl text-white hover:text-white/80 transition-colors hidden sm:block"
          >
            upNext
          </button>

          {/* Compact Search */}
          <form onSubmit={handleCompactSubmit} className="flex-1 max-w-xl">
            <div className="relative flex items-center">
              <input
                ref={compactInputRef}
                type="text"
                value={compactQuery}
                onChange={(e) => setCompactQuery(e.target.value)}
                placeholder="Search for a vibe..."
                disabled={loading}
                className="w-full h-10 rounded-full bg-white/5 border border-white/10 px-4 pr-20 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.07] transition-all disabled:opacity-50"
              />
              <div className="absolute right-1 flex items-center gap-1">
                <AnimatePresence>
                  {compactQuery && !loading && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      type="button"
                      onClick={() => setCompactQuery("")}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
                <motion.button
                  type="submit"
                  disabled={loading || !compactQuery.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Spinner size={14} className="text-white" ariaLabel="Searching..." />
                  ) : (
                    <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                  )}
                </motion.button>
              </div>
            </div>
          </form>
        </div>
        </header>
      )}

      <div className="relative flex min-h-dvh flex-col">
        <AnimatePresence mode="wait">
          {viewState === "hero" ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={pageTransition}
              className="flex flex-1 flex-col items-center justify-center px-4 py-12"
            >
              {/* Hero Content */}
              <div className="w-full max-w-2xl space-y-10">
                {/* Logo/Wordmark */}
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <motion.h1
                    className="font-display text-5xl sm:text-6xl text-white"
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 25,
                      delay: 0.15
                    }}
                  >
                    upNext
                  </motion.h1>
                  <motion.p
                    className="mt-4 text-base sm:text-lg text-white/50 font-medium"
                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ delay: 0.35, duration: 0.4, ease: "easeOut" }}
                  >
                    Describe a vibe. Find your next watch.
                  </motion.p>
                </motion.div>

                {/* Search Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <HeroSearchCard onSearch={handleSearch} loading={loading} />
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={pageTransition}
              className="flex flex-1 flex-col pt-[calc(4rem+env(safe-area-inset-top))]"
            >
              {/* Main Content */}
              <main className="container flex w-full flex-1 flex-col gap-8 pt-8 px-4 sm:px-6 pb-16">
                {/* Loading State */}
                <AnimatePresence mode="wait">
                  {loading && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mx-auto w-full max-w-7xl"
                    >
                      <div className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {[...Array(10)].map((_, index) => (
                          <SkeletonCard key={index} index={index} />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Error State */}
                  {error && !loading && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="mx-auto flex w-full max-w-2xl flex-col items-center text-center border-destructive/40 bg-destructive/15">
                        <CardHeader className="items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/30">
                            <AlertCircle className="h-6 w-6 text-destructive-foreground" />
                          </div>
                          <CardTitle className="text-xl">
                            {typeof error === 'object' && error.timeout
                              ? 'Search timed out'
                              : 'We lost the signal'}
                          </CardTitle>
                          <CardDescription className="text-sm text-muted-foreground">
                            {typeof error === 'object' ? error.message : error}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex w-full items-center justify-center gap-3">
                          <Button onClick={handleBackToHero} size="lg" variant="accent">
                            Try again
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Empty Results */}
                  {!loading && hasSearched && results.length === 0 && !error && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <EmptyState
                        type="no-results"
                        query={searchMetadata?.query}
                        onSuggestionClick={(suggestion) => handleSearch(suggestion, null)}
                      />
                    </motion.div>
                  )}

                  {/* Results Grid */}
                  {hasResults && !loading && (
                    <motion.div
                      key="results-grid"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ResultsGrid
                        results={results}
                        searchMetadata={searchMetadata}
                        hasMore={hasMore}
                        loadingMore={loadingMore}
                        onLoadMore={loadMore}
                        onRefresh={refresh}
                        isRefreshing={refreshing}
                        totalCount={searchMetadata?.totalCount}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </main>

              {/* Floating Back to Top Button */}
              <AnimatePresence>
                {showBackToTop && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={handleBackToTop}
                    className="fixed right-6 bottom-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/90 text-white shadow-lg shadow-amber-500/30 backdrop-blur-sm hover:bg-amber-500 active:scale-95 transition-colors"
                    aria-label="Back to top"
                  >
                    <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Footer */}
              <footer className="pb-safe pb-8 pt-4">
                <div className="container flex flex-col items-center gap-2 text-center text-xs text-white/30">
                  <p>Powered by multi-embedding semantic search</p>
                </div>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
