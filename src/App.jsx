import { useState, useRef, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { AlertCircle, ArrowUp, X, Menu, Sparkles } from "lucide-react";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Spinner } from "./components/ui/spinner";
import { UpNextLogo } from "./components/ui/UpNextLogo";
import { SkeletonCard } from "./components/SkeletonCard";
import { MobileTopNav } from "./components/Sidebar/MobileTopNav";
import { EmptyState } from "./components/EmptyState";
import { ResultsGrid } from "./components/ResultsGrid";
import { HeroSearchCard } from "./components/HeroSearchCard";
import { DiscoverySection } from "./components/Discovery";
import { AppLayout } from "./components/Layout/AppLayout";
import { useSearch } from "./hooks/useSearch";
import { useRecentSearches } from "./hooks/useRecentSearches";
import { useRecommendations } from "./hooks/useRecommendations";
import { useSidebar } from "./contexts/SidebarContext";
import { springConfigs } from "./lib/animations";
import { haptics } from "./lib/haptics";
import { findSimilar } from "./lib/api";

/**
 * Mobile hamburger menu button
 * Opens sidebar drawer on tap
 */
function MobileMenuButton() {
  const { toggle, isMobile } = useSidebar();

  if (!isMobile) return null;

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/15 hover:text-brand-golden transition-colors md:hidden"
      aria-label="Open menu"
    >
      <Menu className="h-4 w-4" />
    </motion.button>
  );
}

/**
 * Sticky results header with sidebar-aware positioning
 * Red gradient background matching mobile top nav
 */
function StickyResultsHeader({ compactQuery, setCompactQuery, loading, onSubmit, onBackToHero, compactInputRef }) {
  const { isOpen, isMobile } = useSidebar();

  // Calculate left position for header (full-width, responds to sidebar)
  const headerLeft = isMobile ? 0 : isOpen ? "var(--sidebar-expanded)" : "var(--sidebar-collapsed)";

  return (
    <motion.header
      className="fixed top-0 right-0 z-50 border-b border-brand-red/20 shadow-[0_4px_20px_rgba(0,0,0,0.15)] pt-[env(safe-area-inset-top)]"
      style={{
        background: `linear-gradient(180deg, rgba(176, 17, 16, 1) 0%, rgba(156, 14, 14, 1) 100%)`,
      }}
      initial={false}
      animate={{ left: headerLeft }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <div className="container px-4 sm:px-6">
        <div className="mx-auto w-full max-w-7xl px-0 sm:px-6 lg:px-8 flex h-16 items-center gap-4">
            {/* Mobile Menu Button - only visible on mobile */}
            <MobileMenuButton />

            {/* Logo */}
            <button
              type="button"
              onClick={onBackToHero}
              className="hidden sm:block shrink-0"
            >
              <UpNextLogo size="lg" variant="light" />
            </button>

            {/* Compact Search - Transparent input on red background */}
            <form onSubmit={onSubmit} className="flex-1 max-w-xl">
              <div className="relative flex items-center">
                <input
                  ref={compactInputRef}
                  type="text"
                  value={compactQuery}
                  onChange={(e) => setCompactQuery(e.target.value)}
                  placeholder="Search for a vibe..."
                  disabled={loading}
                  className="w-full h-11 rounded-full bg-white/10 border-2 border-white/20 px-5 pr-24 text-sm text-white font-medium placeholder:text-white/60 focus:outline-none focus:border-brand-golden focus:bg-white/15 focus:shadow-[0_0_0_4px_rgba(238,199,69,0.2)] transition-all disabled:opacity-50"
                />
                <div className="absolute right-1.5 flex items-center gap-1">
                  <AnimatePresence>
                    {compactQuery && !loading && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        type="button"
                        onClick={() => setCompactQuery("")}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                  <motion.button
                    type="submit"
                    disabled={loading || !compactQuery.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-golden text-[#481B13] shadow-md transition-all duration-200 hover:bg-brand-golden/90 hover:shadow-lg disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Spinner size={14} className="text-[#481B13]" ariaLabel="Searching..." />
                    ) : (
                      <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                    )}
                  </motion.button>
                </div>
              </div>
            </form>
        </div>
      </div>
    </motion.header>
  );
}

const pageTransition = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1]
};

function AppContent() {
  const { results, loading, refreshing, error, searchMetadata, hasMore, currentPage, totalPages, search, loadMore, goToPage, refresh, reset, setSimilarResults, startSimilarLoading, setSimilarError } = useSearch();
  const { addSearch } = useRecentSearches();
  const { recommendations, loading: recsLoading, error: recsError } = useRecommendations();
  const [compactQuery, setCompactQuery] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
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

  // Convert typeFilter ("all", "movie", "tv") to kindFilter array for API
  const getKindFilterArray = (filter) => {
    if (filter === "all") return null;
    return [filter];
  };

  const handleSearch = (query, kindFilter) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCompactQuery(query);
    addSearch(query);
    // If kindFilter explicitly passed, use it (and update typeFilter state)
    if (kindFilter) {
      setTypeFilter(kindFilter === "tv" ? "tv" : "movie");
      search(query, 80, 0, [kindFilter]);
    } else {
      // Use current typeFilter
      search(query, 80, 0, getKindFilterArray(typeFilter));
    }
  };

  // Handle @mention similar search
  const handleSimilarSearch = async (titleId, kindFilter) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    startSimilarLoading();
    setCompactQuery(""); // Clear compact query for similar search

    try {
      const data = await findSimilar(titleId, kindFilter);
      setSimilarResults(data, data.sourceTitle);
    } catch (err) {
      setSimilarError(err);
    }
  };

  // Handle type filter change - re-run current search with new filter
  const handleTypeFilterChange = (newFilter) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTypeFilter(newFilter);
    if (searchMetadata?.query) {
      search(searchMetadata.query, 80, 0, getKindFilterArray(newFilter));
    }
  };

  // Sidebar search handler
  const handleSidebarSearch = (query) => {
    handleSearch(query, null);
  };

  // Surprise Me - picks random query and searches
  const handleSurpriseMe = (query) => {
    handleSearch(query, null);
  };

  // Category select - picks random from category and searches
  const handleCategorySelect = (query) => {
    handleSearch(query, null);
  };

  const handleCompactSubmit = (e) => {
    e?.preventDefault();
    if (compactQuery.trim()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      addSearch(compactQuery.trim());
      search(compactQuery.trim(), 80, 0, getKindFilterArray(typeFilter));
    }
  };

  const handleBackToHero = () => {
    reset();
    setCompactQuery("");
    setTypeFilter("all");
  };

  const handleBackToTop = () => {
    haptics.light();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Vibe search - search for a specific vibe term
  const handleVibeSearch = (vibe) => {
    handleSearch(vibe, null);
  };

  // More Like This - search for similar movies based on vibes/genres
  const handleMoreLikeThis = (movie) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const vibes = movie.vibes || [];
    const genres = movie.genres || [];

    // Build a query from vibes and genres
    let query;
    if (vibes.length > 0) {
      query = `${vibes.slice(0, 2).join(" ")} ${movie.kind === "tv" ? "TV shows" : "movies"}`;
    } else if (genres.length > 0) {
      query = `${genres.slice(0, 2).join(" ")} ${movie.kind === "tv" ? "TV shows" : "movies"} like ${movie.title}`;
    } else {
      query = `Movies similar to ${movie.title}`;
    }

    handleSearch(query, movie.kind === "tv" ? "tv" : "movie");
  };

  return (
    <AppLayout
      onSearch={handleSidebarSearch}
      onSurpriseMe={handleSurpriseMe}
      onCategorySelect={handleCategorySelect}
      onHome={handleBackToHero}
    >
    <div className="relative min-h-dvh">
      {/* Sticky Nav - Only render when showing results */}
      {viewState === "results" && (
        <StickyResultsHeader
          compactQuery={compactQuery}
          setCompactQuery={setCompactQuery}
          loading={loading}
          onSubmit={handleCompactSubmit}
          onBackToHero={handleBackToHero}
          compactInputRef={compactInputRef}
        />
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
              className="flex flex-1 flex-col"
            >
              {/* Mobile Top Nav - Only on hero, only on mobile */}
              <MobileTopNav onSurpriseMe={handleSurpriseMe} />

              {/* Hero Content - Centered search area */}
              <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 pt-[calc(6rem+env(safe-area-inset-top))] md:pt-12">
                <div className="w-full max-w-2xl space-y-10">
                  {/* Logo/Wordmark */}
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    <motion.h1
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 25,
                        delay: 0.15
                      }}
                    >
                      <UpNextLogo size="hero" variant="dark" />
                    </motion.h1>
                    <motion.p
                      className="mt-4 text-base sm:text-lg text-gray-500 font-medium"
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
                    <HeroSearchCard onSearch={handleSearch} onSimilarSearch={handleSimilarSearch} loading={loading} />
                  </motion.div>
                </div>
              </div>

              {/* Discovery Section - Below hero */}
              <DiscoverySection
                recommendations={recommendations}
                loading={recsLoading}
                error={recsError}
                onCardClick={(item) => handleSearch(item.title, null)}
                onMoodClick={(query) => handleSearch(query, null)}
              />
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
              <main className="container flex w-full flex-1 flex-col gap-8 pt-4 sm:pt-6 px-4 sm:px-6 pb-16">
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
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={goToPage}
                        onRefresh={refresh}
                        isRefreshing={refreshing}
                        totalCount={searchMetadata?.totalCount}
                        onMoreLikeThis={handleMoreLikeThis}
                        onVibeSearch={handleVibeSearch}
                        typeFilter={typeFilter}
                        onTypeFilterChange={handleTypeFilterChange}
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
                <div className="container flex flex-col items-center gap-2 text-center text-xs text-gray-400">
                  <p>Powered by multi-embedding semantic search</p>
                </div>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </AppLayout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
