import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useAnimation, useMotionValue } from "framer-motion";
import { Star, Calendar, Clock, User, PlayCircle, Sparkles, Tag } from "lucide-react";
import { Badge } from "./ui/badge";
import { TrailerPlayer } from "./TrailerPlayer";
import { haptics } from "../lib/haptics";
import {
  bottomSheetVariantsV2,
  bottomSheetDragSpring,
  drawerBackdropVariants,
  prefersReducedMotion,
} from "../lib/animations";

const formatRuntime = (minutes) => {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

/**
 * Focus trap hook for accessibility
 */
function useFocusTrap(isOpen, containerRef) {
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;

    const getFocusableElements = () => {
      if (!containerRef.current) return [];
      return containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    };

    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      setTimeout(() => focusableElements[0].focus(), 50);
    }

    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, containerRef]);
}

/**
 * Mobile bottom sheet for movie details
 * Single-state (85vh) with drag-to-dismiss
 */
export function MovieBottomSheet({ movie, onClose, onMoreLikeThis }) {
  const [isOpen, setIsOpen] = useState(false);
  const [trailerLoaded, setTrailerLoaded] = useState(false);
  const cachedMovie = useRef(null);
  const sheetRef = useRef(null);
  const contentRef = useRef(null);
  const controls = useAnimation();
  const dragY = useMotionValue(0);

  // Track if content is scrolled (prevents dismiss when scrolled)
  const [isContentScrolled, setIsContentScrolled] = useState(false);

  // Update cached movie and open state when movie changes
  useEffect(() => {
    if (movie) {
      cachedMovie.current = movie;
      setIsOpen(true);
      setTrailerLoaded(false);
      document.body.style.overflow = "hidden";
    }
  }, [movie]);

  // Reset scroll on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    haptics.light();
    setIsOpen(false);
    document.body.style.overflow = "";
  }, []);

  // After exit animation, call parent onClose
  const handleExitComplete = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Focus trap
  useFocusTrap(isOpen, sheetRef);

  // Track content scroll position
  const handleContentScroll = useCallback((e) => {
    setIsContentScrolled(e.target.scrollTop > 0);
  }, []);

  // Handle "More Like This" - close sheet and trigger callback
  const handleMoreLikeThis = useCallback((m) => {
    handleClose();
    setTimeout(() => {
      onMoreLikeThis?.(m);
    }, 300);
  }, [handleClose, onMoreLikeThis]);

  // Simplified drag end handler - single-state sheet
  const handleDragEnd = useCallback((event, info) => {
    const { velocity, offset } = info;
    const height = window.innerHeight * 0.85;
    const dragPercent = offset.y / height;

    if (velocity.y > 400 || dragPercent > 0.35) {
      haptics.medium();
      handleClose();
    } else {
      controls.start("visible", bottomSheetDragSpring);
    }
  }, [handleClose, controls]);

  const displayMovie = cachedMovie.current;
  if (!displayMovie) return null;

  const {
    id,
    title,
    kind,
    release_date,
    overview,
    genres,
    director,
    cast,
    vote_average,
    runtime_minutes,
    poster_path,
    backdrop_path,
  } = displayMovie;

  // Parse genres (may be JSON strings from DB)
  const safeGenres = Array.isArray(genres) ? genres :
    (typeof genres === 'string' ? JSON.parse(genres) : []);

  const backdropUrl = backdrop_path
    ? `https://image.tmdb.org/t/p/w780${backdrop_path}`
    : poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : null;

  const year = release_date ? new Date(release_date).getFullYear() : "N/A";
  const parsedCast = typeof cast === "string" ? JSON.parse(cast) : cast;
  const topCast = Array.isArray(parsedCast) ? parsedCast.slice(0, 8) : [];

  const reducedMotion = prefersReducedMotion();

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={drawerBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-[#0a0a0f]/70 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            variants={reducedMotion ? {} : bottomSheetVariantsV2}
            initial={reducedMotion ? { y: 0 } : "hidden"}
            animate={reducedMotion ? { y: 0 } : "visible"}
            exit={reducedMotion ? { opacity: 0 } : "exit"}
            drag={!isContentScrolled && !reducedMotion ? "y" : false}
            dragConstraints={{ top: 0, bottom: window.innerHeight * 0.5 }}
            dragElastic={{ top: 0.02, bottom: 0.15 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            style={{ y: dragY, zIndex: 60 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-[28px] bg-[rgba(18,18,24,0.98)] backdrop-blur-2xl border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]"
          >
            {/* Drag Handle Zone */}
            <motion.div
              className="w-full h-7 pt-3 flex justify-center cursor-grab active:cursor-grabbing shrink-0"
              onTouchStart={(e) => e.stopPropagation()}
              whileTap={reducedMotion ? {} : { scale: 0.98 }}
            >
              <motion.div
                className="w-10 h-1 bg-white/20 rounded-full"
                initial={{ scaleX: 1 }}
                whileHover={reducedMotion ? {} : { scaleX: 1.2, backgroundColor: "rgba(255,255,255,0.35)" }}
                whileTap={reducedMotion ? {} : { scaleX: 0.9, backgroundColor: "rgba(255,255,255,0.4)" }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              />
            </motion.div>

            {/* Screen reader title */}
            <h2 id="sheet-title" className="sr-only">
              {title} Details
            </h2>

            {/* Hero Image Zone - negative margin technique for rounded corners */}
            <div className="relative overflow-hidden rounded-t-[28px] -mt-7 pt-7 h-[208px] shrink-0">
              {backdropUrl && (
                <img
                  src={backdropUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-top"
                />
              )}
              {!backdropUrl && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02]" />
              )}
              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#121218] via-[#121218]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#121218]/40 to-transparent" />

              {/* Title overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                <h1 className="text-lg font-semibold text-white mb-1.5 drop-shadow-lg tracking-tight font-heading line-clamp-2">
                  {title}
                </h1>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/80">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-white/60" /> {year}
                  </span>
                  {runtime_minutes && (
                    <>
                      <span className="text-white/30">|</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-white/60" /> {formatRuntime(runtime_minutes)}
                      </span>
                    </>
                  )}
                  {vote_average && (
                    <>
                      <span className="text-white/30">|</span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <Star className="h-3 w-3 fill-current" /> {vote_average.toFixed(1)}
                      </span>
                    </>
                  )}
                  <Badge className="bg-amber-500/90 text-amber-950 text-xs py-0 h-5 ml-1 font-medium">
                    {kind === "tv" ? "TV" : "Movie"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div
              ref={contentRef}
              onScroll={handleContentScroll}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-5"
            >
              {/* Overview */}
              <section>
                <h3 className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">
                  Overview
                </h3>
                <p className="text-sm leading-relaxed text-white/80">
                  {overview || "No overview available."}
                </p>
              </section>

              {/* Genres - inline text */}
              {safeGenres.length > 0 && (
                <section>
                  <h3 className="text-xs font-medium text-white/40 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                    <Tag className="h-3 w-3 text-amber-400" /> Genres
                  </h3>
                  <p className="text-sm text-white/70">
                    {safeGenres.join(" / ")}
                  </p>
                </section>
              )}

              {/* Trailer */}
              {id && (
                <section>
                  <h3 className="text-xs font-medium text-white/40 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                    <PlayCircle className="h-3 w-3 text-amber-400" /> Trailer
                  </h3>
                  {trailerLoaded ? (
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
                      <TrailerPlayer
                        tmdbId={id}
                        mediaType={kind === "tv" ? "tv" : "movie"}
                        title={title}
                      />
                    </div>
                  ) : (
                    <motion.button
                      onClick={() => setTrailerLoaded(true)}
                      className="relative w-full rounded-xl border border-white/10 bg-black/50 overflow-hidden aspect-video"
                      whileHover={reducedMotion ? {} : { scale: 1.01 }}
                      whileTap={reducedMotion ? {} : { scale: 0.99 }}
                    >
                      {backdropUrl && (
                        <img
                          src={backdropUrl}
                          alt={`${title} trailer thumbnail`}
                          className="w-full h-full object-cover opacity-60"
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          className="w-14 h-14 rounded-full bg-amber-500/90 flex items-center justify-center shadow-lg"
                          animate={reducedMotion ? {} : {
                            scale: [1, 1.05, 1],
                            opacity: [0.9, 1, 0.9],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <PlayCircle className="w-8 h-8 text-white" />
                        </motion.div>
                      </div>
                      <div className="absolute bottom-2 left-2 text-xs text-white/60">
                        Tap to load trailer
                      </div>
                    </motion.button>
                  )}
                </section>
              )}

              {/* Cast - horizontal scroll */}
              {topCast.length > 0 && (
                <section>
                  <h3 className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">
                    Cast
                  </h3>
                  <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
                    {topCast.map((actor, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.04] rounded-full border border-white/[0.06] shrink-0"
                      >
                        <User className="h-3 w-3 text-white/40" />
                        <span className="text-xs text-white/70 whitespace-nowrap">
                          {actor.name || actor}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Director */}
              {director && (
                <section>
                  <h3 className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">
                    Director
                  </h3>
                  <p className="text-sm text-white/80">{director}</p>
                </section>
              )}
            </div>

            {/* Sticky "More Like This" Button */}
            {onMoreLikeThis && (
              <div className="shrink-0 px-4 pb-6 pt-3 bg-gradient-to-t from-[#121218] via-[#121218] to-transparent">
                <motion.button
                  onClick={() => {
                    haptics.light();
                    handleMoreLikeThis(displayMovie);
                  }}
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-shadow"
                  whileHover={reducedMotion ? {} : { scale: 1.02, y: -1 }}
                  whileTap={reducedMotion ? {} : { scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Sparkles className="w-4 h-4" />
                  More Like This
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
