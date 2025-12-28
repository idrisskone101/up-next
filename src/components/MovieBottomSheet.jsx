import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, Calendar, Clock, User, PlayCircle, Sparkles, Tag, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { TrailerPlayer } from "./TrailerPlayer";
import { haptics } from "../lib/haptics";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "./ui/drawer";
import { prefersReducedMotion } from "../lib/animations";

const formatRuntime = (minutes) => {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

/**
 * Mobile bottom sheet for movie details using shadcn Drawer
 * Styled for Cinematic Command Center aesthetic
 */
export function MovieBottomSheet({ movie, onClose, onMoreLikeThis }) {
  const [isOpen, setIsOpen] = useState(false);
  const cachedMovie = useRef(null);

  // Update cached movie and open state when movie changes
  useEffect(() => {
    if (movie) {
      cachedMovie.current = movie;
      setIsOpen(true);
    }
  }, [movie]);

  // Handle close
  const handleClose = useCallback(() => {
    haptics.light();
    setIsOpen(false);
  }, []);

  // Handle drawer open state change
  const handleOpenChange = useCallback((open) => {
    if (!open) {
      handleClose();
    }
  }, [handleClose]);

  // After close animation, call parent onClose
  useEffect(() => {
    if (!isOpen && cachedMovie.current) {
      const timer = setTimeout(() => {
        onClose();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  // Handle "More Like This" - close sheet and trigger callback
  const handleMoreLikeThis = useCallback((m) => {
    handleClose();
    setTimeout(() => {
      onMoreLikeThis?.(m);
    }, 300);
  }, [handleClose, onMoreLikeThis]);

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
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent
        className="h-[85vh] rounded-t-[28px] overflow-hidden bg-[rgba(18,18,24,0.98)] backdrop-blur-2xl border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] focus:outline-none"
      >
        {/* Drawer handle - styled for design system */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/20 rounded-full z-10" />

        {/* Close button */}
        <motion.button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 w-11 h-11 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:bg-black/60 hover:text-amber-400 transition-colors"
          whileHover={reducedMotion ? {} : { scale: 1.05 }}
          whileTap={reducedMotion ? {} : { scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </motion.button>

        {/* Screen reader title */}
        <DrawerHeader className="sr-only">
          <DrawerTitle>{title} Details</DrawerTitle>
          <DrawerDescription>Movie information and trailer</DrawerDescription>
        </DrawerHeader>

        {/* Hero Image Zone */}
        <div className="relative overflow-hidden h-[200px] shrink-0">
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
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
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
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
                <TrailerPlayer
                  tmdbId={id}
                  mediaType={kind === "tv" ? "tv" : "movie"}
                  title={title}
                />
              </div>
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
              className="w-full h-12 flex items-center justify-center gap-2 rounded-full bg-white/[0.06] border border-amber-500/25 text-white/85 font-semibold transition-all duration-200 hover:bg-amber-500/12 hover:border-amber-500/40 hover:text-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] active:bg-amber-500/20 active:border-amber-500/50 active:text-amber-300 active:shadow-[inset_0_0_12px_rgba(245,158,11,0.25)]"
              whileHover={reducedMotion ? {} : { scale: 1.02, y: -1 }}
              whileTap={reducedMotion ? {} : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Sparkles className="w-4 h-4" />
              More Like This
            </motion.button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
