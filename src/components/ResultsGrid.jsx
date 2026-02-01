import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MovieCard } from "./MovieCard";
import { MovieDrawer } from "./MovieDrawer";
import { MovieBottomSheet } from "./MovieBottomSheet";
import { FilterBar } from "./FilterBar";
import { useIsMobile } from "../hooks/useMediaQuery";

import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "./ui/pagination";
import { getDiagonalDelay, getCappedDiagonalDelay, enhancedGridItemVariants, mobileGridItemVariants, springConfigs, mobileSpring } from "../lib/animations";
import { haptics } from "../lib/haptics";
import * as analytics from "../lib/analytics";

import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

/**
 * Hook to detect current grid column count based on viewport
 */
function useGridColumns() {
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1280) setColumns(5);      // xl
      else if (width >= 1024) setColumns(4); // lg
      else if (width >= 768) setColumns(3);  // md
      else setColumns(2);                    // default
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  return columns;
}

/**
 * Responsive grid container for movie cards with diagonal wave animations,
 * pull-to-refresh, pagination, and shared element support
 */
export function ResultsGrid({
  results,
  searchMetadata,
  hasMore,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalCount,
  onMoreLikeThis,
  onVibeSearch,
  typeFilter = "all",
  onTypeFilterChange,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract movie ID from URL query param
  const movieIdFromUrl = new URLSearchParams(location.search).get("movie");

  // Find selected movie from URL param
  const selectedMovie = useMemo(() => {
    if (!movieIdFromUrl) return null;
    return results.find((m) => String(m.id) === movieIdFromUrl) || null;
  }, [movieIdFromUrl, results]);

  const containerRef = useRef(null);
  const columns = useGridColumns();
  const isMobile = useIsMobile();

  // Clear URL param if movie not found in results
  useEffect(() => {
    if (movieIdFromUrl && !selectedMovie && results.length > 0) {
      navigate(location.pathname, { replace: true });
    }
  }, [movieIdFromUrl, selectedMovie, results, navigate, location.pathname]);

  // Open drawer via URL
  const handleCardClick = useCallback((movie) => {
    analytics.trackMovieDetailOpened({
      movieId: movie.id,
      title: movie.title,
      kind: movie.kind,
      viewType: isMobile ? 'bottom_sheet' : 'drawer',
      matchScore: movie.combined_score,
      positionInResults: results.indexOf(movie),
    });
    navigate(`?movie=${movie.id}`, { replace: false });
  }, [navigate, isMobile, results]);

  // Close drawer by removing param
  const handleCloseDrawer = useCallback(() => {
    analytics.trackMovieDetailClosed({
      movieId: selectedMovie?.id,
      viewType: isMobile ? 'bottom_sheet' : 'drawer',
    });
    navigate(location.pathname, { replace: true });
  }, [navigate, location.pathname, selectedMovie, isMobile]);

  // More Like This - close drawer first, then trigger search
  const handleMoreLikeThis = useCallback((movie) => {
    navigate(location.pathname, { replace: true });
    onMoreLikeThis?.(movie);
  }, [navigate, location.pathname, onMoreLikeThis]);

  // Preload first 6 visible results' backdrops for instant modal display
  useEffect(() => {
    results.slice(0, 6).forEach((movie) => {
      if (movie.backdrop_path) {
        const img = new Image();
        img.src = `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
      }
    });
  }, [results]);

  const handlePageChange = useCallback((page) => {
    haptics.light();
    analytics.trackPageChanged({ pageNumber: page, totalPages });
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [onPageChange, totalPages]);

  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex flex-col items-center justify-center py-20 px-6"
      >
        <motion.span
          className="text-5xl mb-4"
          initial={{ scale: 0.8, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          🎬
        </motion.span>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No matches found
        </h3>
        <p className="text-gray-500 text-sm text-center max-w-sm">
          Try a different vibe or mood — we've got tons of hidden gems waiting for you!
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="space-y-8 relative pb-16"
      >
          {/* Movie results grid */}
          <div className="mx-auto w-full max-w-7xl px-0 sm:px-6 lg:px-8">
            {/* Similar Search Header */}
            <AnimatePresence>
              {searchMetadata?.isSimilarSearch && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="mb-4 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-brand-golden" />
                  <span className="text-sm text-gray-500">
                    Titles similar to{" "}
                    <span className="font-medium text-brand-orange">
                      {searchMetadata.sourceTitle}
                    </span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filter Bar */}
            <FilterBar
              activeType={typeFilter}
              onTypeChange={onTypeFilterChange}
            />

            <motion.div
              className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AnimatePresence mode="popLayout">
                {results.map((movie, index) => {
                  const isSelected = selectedMovie?.id === movie.id;
                  // Use mobile-optimized animations on mobile
                  const variants = isMobile ? mobileGridItemVariants : enhancedGridItemVariants;
                  const delayFn = isMobile ? getCappedDiagonalDelay : getDiagonalDelay;
                  const transitionConfig = isMobile ? mobileSpring : springConfigs.snappy;
                  return (
                    <motion.div
                      key={movie.id}
                      variants={variants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{
                        ...transitionConfig,
                        delay: delayFn(index, columns, 0.03),
                      }}
                      className={isSelected ? "ring-2 ring-brand-golden/60 rounded-xl shadow-[0_0_24px_rgba(238,199,69,0.25)]" : ""}
                    >
                      <MovieCard
                        movie={movie}
                        index={index}
                        onClick={() => handleCardClick(movie)}
                        onPlayTrailer={() => handleCardClick(movie)}
                        isSelected={isSelected}
                        isDimmed={selectedMovie && !isSelected}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                className="mt-10 flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfigs.gentle, delay: 0.3 }}
              >
                {/* Page info */}
                <p className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages} · {totalCount} results
                </p>

                {/* Pagination controls */}
                <Pagination>
                  <PaginationContent className="gap-2 bg-white/60 backdrop-blur-sm rounded-full px-2 py-1.5 border border-gray-200/80 shadow-sm">
                    {/* Previous button */}
                    <PaginationItem>
                      <motion.button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                        whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                        className="flex h-9 items-center gap-1 rounded-full px-3 text-sm font-medium text-gray-600 hover:text-brand-red hover:bg-brand-red/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Previous</span>
                      </motion.button>
                    </PaginationItem>

                    {/* Page numbers */}
                    {(() => {
                      const pages = [];
                      const showEllipsisStart = currentPage > 3;
                      const showEllipsisEnd = currentPage < totalPages - 2;

                      // Always show first page
                      pages.push(1);

                      // Show ellipsis or page 2
                      if (showEllipsisStart) {
                        pages.push("ellipsis-start");
                      } else if (totalPages > 1) {
                        pages.push(2);
                      }

                      // Show current page and neighbors
                      for (let i = Math.max(3, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
                        if (!pages.includes(i)) {
                          pages.push(i);
                        }
                      }

                      // Show ellipsis or second-to-last page
                      if (showEllipsisEnd) {
                        pages.push("ellipsis-end");
                      } else if (totalPages > 2) {
                        if (!pages.includes(totalPages - 1)) {
                          pages.push(totalPages - 1);
                        }
                      }

                      // Always show last page
                      if (totalPages > 1 && !pages.includes(totalPages)) {
                        pages.push(totalPages);
                      }

                      return pages.map((page, idx) => {
                        if (page === "ellipsis-start" || page === "ellipsis-end") {
                          return (
                            <PaginationItem key={page}>
                              <span className="flex h-9 w-6 items-center justify-center text-gray-400 text-sm">
                                ...
                              </span>
                            </PaginationItem>
                          );
                        }

                        const isActive = page === currentPage;
                        return (
                          <PaginationItem key={page}>
                            <motion.button
                              onClick={() => handlePageChange(page)}
                              whileHover={{ scale: isActive ? 1 : 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                                isActive
                                  ? "bg-brand-golden text-[#481B13] shadow-md"
                                  : "text-gray-600 hover:text-brand-orange hover:bg-brand-golden/10"
                              }`}
                            >
                              {page}
                            </motion.button>
                          </PaginationItem>
                        );
                      });
                    })()}

                    {/* Next button */}
                    <PaginationItem>
                      <motion.button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
                        whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                        className="flex h-9 items-center gap-1 rounded-full px-3 text-sm font-medium text-gray-600 hover:text-brand-red hover:bg-brand-red/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </motion.button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </motion.div>
            )}
          </div>
        </div>

      {/* Movie Detail */}
      {/* Use bottom sheet on mobile, drawer on desktop */}
      {isMobile ? (
        <MovieBottomSheet
          movie={selectedMovie}
          onClose={handleCloseDrawer}
          onMoreLikeThis={handleMoreLikeThis}
          onVibeSearch={onVibeSearch}
        />
      ) : (
        <MovieDrawer
          movie={selectedMovie}
          onClose={handleCloseDrawer}
          onMoreLikeThis={handleMoreLikeThis}
        />
      )}
    </>
  );
}
