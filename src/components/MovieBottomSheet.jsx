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
        className="h-[85vh] rounded-t-[28px] overflow-hidden bg-black border-t border-white/20 shadow-[0_-20px_80px_rgba(0,0,0,0.8)] focus:outline-none"
      >
        {/* Drawer handle - high contrast */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/40 rounded-full z-10" />

        {/* Close button - bold red hover */}
        <motion.button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-brand-red hover:border-brand-red transition-all duration-200"
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
        <div className="relative overflow-hidden h-[220px] shrink-0">
          {backdropUrl && (
            <img
              src={backdropUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
          )}
          {!backdropUrl && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          )}
          {/* Gradient overlays - pure black */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

          {/* Title overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
            <h1 className="text-xl font-bold text-white mb-2 drop-shadow-2xl tracking-tight font-heading line-clamp-2">
              {title}
            </h1>

            {/* Metadata row - high contrast */}
            <div className="flex flex-wrap items-center gap-2.5 text-sm">
              <span className="flex items-center gap-1 text-white/90 font-medium">
                <Calendar className="h-3.5 w-3.5 text-brand-red" /> {year}
              </span>
              {runtime_minutes && (
                <>
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1 text-white/90 font-medium">
                    <Clock className="h-3.5 w-3.5 text-brand-red" /> {formatRuntime(runtime_minutes)}
                  </span>
                </>
              )}
              {vote_average && (
                <>
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1 text-brand-golden font-bold">
                    <Star className="h-3.5 w-3.5 fill-brand-golden" /> {vote_average.toFixed(1)}
                  </span>
                </>
              )}
              <Badge className="bg-brand-red text-white text-xs py-0.5 px-2.5 h-6 font-bold uppercase">
                {kind === "tv" ? "TV" : "Film"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Overview */}
          <section>
            <h3 className="text-xs font-bold text-brand-red mb-2 uppercase tracking-widest">
              Synopsis
            </h3>
            <p className="text-sm leading-relaxed text-white/90">
              {overview || "No overview available."}
            </p>
          </section>

          {/* Genres */}
          {safeGenres.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-brand-red mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                <Tag className="h-3 w-3" /> Genres
              </h3>
              <div className="flex flex-wrap gap-2">
                {safeGenres.map((g, i) => (
                  <span key={i} className="text-sm text-white/80 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                    {g}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Trailer */}
          {id && (
            <section>
              <h3 className="text-xs font-bold text-brand-red mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                <PlayCircle className="h-3 w-3" /> Trailer
              </h3>
              <div className="overflow-hidden rounded-xl border-2 border-white/20 bg-black">
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
              <h3 className="text-xs font-bold text-brand-red mb-2 uppercase tracking-widest">
                Cast
              </h3>
              <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5">
                {topCast.map((actor, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/10 rounded-full border border-white/20 shrink-0"
                  >
                    <User className="h-3.5 w-3.5 text-white/60" />
                    <span className="text-sm text-white/90 whitespace-nowrap">
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
              <h3 className="text-xs font-bold text-brand-red mb-2 uppercase tracking-widest">
                Director
              </h3>
              <p className="text-sm text-white/90">{director}</p>
            </section>
          )}
        </div>

        {/* Sticky "More Like This" Button */}
        {onMoreLikeThis && (
          <div className="shrink-0 px-5 pb-8 pt-4 bg-gradient-to-t from-black via-black to-transparent">
            <motion.button
              onClick={() => {
                haptics.light();
                handleMoreLikeThis(displayMovie);
              }}
              className="w-full h-14 flex items-center justify-center gap-2 rounded-full bg-brand-red text-white font-bold uppercase tracking-wide transition-all duration-200 hover:bg-brand-red/90 hover:shadow-[0_0_30px_rgba(176,17,16,0.4)] active:scale-[0.98]"
              whileHover={reducedMotion ? {} : { scale: 1.02, y: -1 }}
              whileTap={reducedMotion ? {} : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Sparkles className="w-5 h-5" />
              More Like This
            </motion.button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
