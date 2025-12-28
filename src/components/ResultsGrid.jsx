import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
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
import { getDiagonalDelay, enhancedGridItemVariants, springConfigs } from "../lib/animations";
import { haptics } from "../lib/haptics";
import { prefetchTrailers } from "../lib/trailerCache";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  onRefresh,
  isRefreshing = false,
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

  const [sortOrder, setSortOrder] = useState("match");
  const containerRef = useRef(null);
  const columns = useGridColumns();

  // Clear URL param if movie not found in results
  useEffect(() => {
    if (movieIdFromUrl && !selectedMovie && results.length > 0) {
      navigate(location.pathname, { replace: true });
    }
  }, [movieIdFromUrl, selectedMovie, results, navigate, location.pathname]);

  // Open drawer via URL
  const handleCardClick = useCallback((movie) => {
    navigate(`?movie=${movie.id}`, { replace: false });
  }, [navigate]);

  // Close drawer by removing param
  const handleCloseDrawer = useCallback(() => {
    navigate(location.pathname, { replace: true });
  }, [navigate, location.pathname]);

  // More Like This - close drawer first, then trigger search
  const handleMoreLikeThis = useCallback((movie) => {
    navigate(location.pathname, { replace: true });
    onMoreLikeThis?.(movie);
  }, [navigate, location.pathname, onMoreLikeThis]);

  // Sort results (type filtering is now server-side)
  const sortedResults = useMemo(() => {
    if (sortOrder === "year") {
      return [...results].sort((a, b) => {
        const yearA = a.release_date ? new Date(a.release_date).getFullYear() : 0;
        const yearB = b.release_date ? new Date(b.release_date).getFullYear() : 0;
        return yearB - yearA;
      });
    } else if (sortOrder === "rating") {
      return [...results].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    }
    // Default "match" sort uses original order (already sorted by score)
    return results;
  }, [results, sortOrder]);

  // Preload first 6 visible results' backdrops for instant modal display
  useEffect(() => {
    results.slice(0, 6).forEach((movie) => {
      if (movie.backdrop_path) {
        const img = new Image();
        img.src = `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
      }
    });
  }, [results]);

  // Prefetch trailers for first 10 results
  useEffect(() => {
    if (results.length > 0) {
      prefetchTrailers(results, 10);
    }
  }, [results]);

  const isMobile = useIsMobile();

  if (results.length === 0) {
    return null;
  }

  return (
    <>
      <LayoutGroup>
        <div
          ref={containerRef}
          className="space-y-8 relative pb-16"
        >
          {/* Movie results grid */}
          <div className="mx-auto w-full max-w-7xl px-0 sm:px-6 lg:px-8">
            {/* Filter Bar */}
            <FilterBar
              activeType={typeFilter}
              onTypeChange={onTypeFilterChange}
              activeSort={sortOrder}
              onSortChange={setSortOrder}
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
            />

            <motion.div
              className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AnimatePresence mode="popLayout">
                {sortedResults.map((movie, index) => {
                  const isSelected = selectedMovie?.id === movie.id;
                  return (
                    <motion.div
                      key={movie.id}
                      layout
                      variants={enhancedGridItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{
                        ...springConfigs.snappy,
                        delay: getDiagonalDelay(index, columns, 0.03),
                      }}
                      className={isSelected ? "ring-2 ring-amber-500/60 rounded-xl shadow-[0_0_24px_rgba(251,191,36,0.25)]" : ""}
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
                <p className="text-sm text-white/40">
                  Page {currentPage} of {totalPages} · {totalCount} results
                </p>

                {/* Pagination controls */}
                <Pagination>
                  <PaginationContent className="gap-1">
                    {/* Previous button */}
                    <PaginationItem>
                      <button
                        onClick={() => {
                          haptics.light();
                          onPageChange(currentPage - 1);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        disabled={currentPage === 1}
                        className="flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-all"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Previous</span>
                      </button>
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
                              <span className="flex h-10 w-10 items-center justify-center text-white/40">
                                ...
                              </span>
                            </PaginationItem>
                          );
                        }

                        const isActive = page === currentPage;
                        return (
                          <PaginationItem key={page}>
                            <button
                              onClick={() => {
                                haptics.light();
                                onPageChange(page);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all ${
                                isActive
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                                  : "text-white/60 hover:text-white hover:bg-white/[0.08]"
                              }`}
                            >
                              {page}
                            </button>
                          </PaginationItem>
                        );
                      });
                    })()}

                    {/* Next button */}
                    <PaginationItem>
                      <button
                        onClick={() => {
                          haptics.light();
                          onPageChange(currentPage + 1);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        disabled={currentPage === totalPages}
                        className="flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-all"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </motion.div>
            )}
          </div>
        </div>
      </LayoutGroup>

      {/* Movie Detail - Outside LayoutGroup to prevent grid re-animation */}
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
