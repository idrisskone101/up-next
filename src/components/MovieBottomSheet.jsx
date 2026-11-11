import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, X, Tv, Film } from "lucide-react";
import { TrailerPlayer } from "./TrailerPlayer";
import { ProviderBadges } from "./ProviderBadges";
import { haptics } from "../lib/haptics";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "./ui/drawer";
import {
  prefersReducedMotion,
  synopsisCardVariants,
  castListContainerVariants,
  castListItemVariants,
  ctaFloatAnimation,
} from "../lib/animations";

const formatRuntime = (minutes) => {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const capitalize = (str) => {
  if (typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Golden dot separator for inline metadata
 */
const Dot = () => <span className="text-brand-golden">·</span>;

/**
 * Mobile bottom sheet for movie details using shadcn Drawer
 * Cinematic Card Stack design - consistent with MovieDetail
 */
export function MovieBottomSheet({ movie, onClose, onMoreLikeThis }) {
  const [isOpen, setIsOpen] = useState(false);
  const cachedMovie = useRef(null);

  useEffect(() => {
    if (movie) {
      cachedMovie.current = movie;
      setIsOpen(true);
    }
  }, [movie]);

  const handleClose = useCallback(() => {
    haptics.light();
    setIsOpen(false);
  }, []);

  const handleOpenChange = useCallback((open) => {
    if (!open) {
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    if (!isOpen && cachedMovie.current) {
      const timer = setTimeout(() => {
        onClose();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

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
    runtime_minutes,
    poster_path,
    backdrop_path,
    providers,
    reason,
  } = displayMovie;

  const streamingProviders = providers?.flatrate || [];

  let safeGenres = [];
  if (Array.isArray(genres)) {
    safeGenres = genres;
  } else if (typeof genres === 'string') {
    try {
      safeGenres = JSON.parse(genres);
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('Failed to parse genres:', e);
      }
      safeGenres = [];
    }
  }

  const year = release_date ? new Date(release_date).getFullYear() : null;

  const backdropUrl = backdrop_path
    ? `https://image.tmdb.org/t/p/w780${backdrop_path}`
    : poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : null;

  let parsedCast = cast;
  if (typeof cast === "string") {
    try {
      parsedCast = JSON.parse(cast);
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('Failed to parse cast:', e);
      }
      parsedCast = [];
    }
  }
  const topCast = Array.isArray(parsedCast) ? parsedCast.slice(0, 5) : [];

  const reducedMotion = prefersReducedMotion();

  // Build metadata pieces for inline display (capitalize genres)
  const metaPieces = [];
  if (safeGenres.length > 0) {
    metaPieces.push(...safeGenres.slice(0, 2).map(capitalize));
  }
  if (year) metaPieces.push(year);
  if (runtime_minutes) metaPieces.push(formatRuntime(runtime_minutes));

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange} snapPoints={[1]}>
      <DrawerContent
        className="h-[85vh] rounded-t-[28px] overflow-hidden bg-black border-t border-white/20 shadow-[0_-20px_80px_rgba(0,0,0,0.8)] focus:outline-none"
      >
        {/* Drawer handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/40 rounded-full z-10" />

        {/* Close button */}
        <motion.button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200"
          whileHover={reducedMotion ? {} : { scale: 1.05 }}
          whileTap={reducedMotion ? {} : { scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </motion.button>

        {/* Screen reader title */}
        <DrawerHeader className="sr-only">
          <DrawerTitle>{title} Details</DrawerTitle>
          <DrawerDescription>Movie information and trailer</DrawerDescription>
        </DrawerHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero Image Zone */}
          <div className="relative h-44 overflow-hidden">
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
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />

            {/* Title + metadata overlay */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
              {/* Type badge - matches MovieCard colors */}
              <div
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide mb-2 ${
                  kind === "tv"
                    ? "bg-brand-orange/90 text-white"
                    : "bg-brand-golden text-amber-900"
                }`}
              >
                {kind === "tv" ? (
                  <Tv className="w-2.5 h-2.5" />
                ) : (
                  <Film className="w-2.5 h-2.5" />
                )}
                <span>{kind === "tv" ? "TV" : "Movie"}</span>
              </div>

              {/* Title */}
              <h1 className="text-xl font-bold text-white mb-2 drop-shadow-2xl tracking-tight font-heading line-clamp-2">
                {title}
              </h1>

              {/* Inline metadata: Genre · Genre · Year · Runtime */}
              {metaPieces.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-white/80">
                  {metaPieces.map((piece, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <span>{piece}</span>
                      {i < metaPieces.length - 1 && <Dot />}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Why it's a match - the model's reason for this pick */}
          {reason && (
            <motion.div
              variants={synopsisCardVariants}
              initial="hidden"
              animate="visible"
              className="relative mt-4 mx-4 p-4 bg-brand-golden/10 rounded-2xl border border-brand-golden/30 shadow-xl"
            >
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-golden mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Why it's a match
              </h3>
              <p className="text-sm leading-relaxed text-white/90">{reason}</p>
            </motion.div>
          )}

          {/* Synopsis Card */}
          {overview && (
            <motion.div
              variants={synopsisCardVariants}
              initial="hidden"
              animate="visible"
              className="relative mt-4 mx-4 p-4 bg-gradient-to-br from-neutral-900/95 to-neutral-950/95 rounded-2xl border border-white/10 shadow-xl"
            >
              <p className="text-sm leading-relaxed text-white/90">
                {overview}
              </p>
            </motion.div>
          )}

          {/* Content sections */}
          <div className="px-4 pt-5 pb-6 space-y-6">
            {/* Where to Watch */}
            {streamingProviders.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Where to Watch
                </h3>
                <ProviderBadges providers={streamingProviders} title={title} />
              </section>
            )}

            {/* Trailer */}
            {id && (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Trailer
                </h3>
                <div className="-mx-4">
                  <div className="overflow-hidden">
                    <TrailerPlayer
                      tmdbId={id}
                      mediaType={kind === "tv" ? "tv" : "movie"}
                      title={title}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Cast */}
            {topCast.length > 0 && (
              <motion.section
                variants={castListContainerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Cast
                </h3>
                <div className="space-y-2">
                  {topCast.map((actor, i) => {
                    const name = actor.name || actor;
                    const character = actor.character;
                    return (
                      <motion.div
                        key={i}
                        variants={castListItemVariants}
                        className="text-sm"
                      >
                        <span className="text-white/90 font-medium">{name}</span>
                        {character && (
                          <span className="text-white/50 ml-1.5">as {character}</span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* Director */}
            {director && (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Director
                </h3>
                <p className="text-sm text-brand-golden font-medium">
                  {director}
                </p>
              </section>
            )}
          </div>
        </div>

        {/* Sticky "More Like This" Button */}
        {onMoreLikeThis && (
          <div className="shrink-0 px-4 pb-6 pt-3 bg-gradient-to-t from-black via-black to-transparent">
            <motion.button
              onClick={() => {
                haptics.light();
                handleMoreLikeThis(displayMovie);
              }}
              className="w-full h-12 flex items-center justify-center gap-1.5 rounded-full bg-brand-golden text-black text-sm font-bold uppercase tracking-wide transition-all duration-200 hover:bg-brand-golden/90 hover:shadow-[0_0_30px_rgba(238,199,69,0.4)] active:scale-[0.98]"
              whileHover={reducedMotion ? {} : { scale: 1.02, y: -1 }}
              whileTap={reducedMotion ? {} : { scale: 0.98 }}
              animate={reducedMotion ? {} : ctaFloatAnimation}
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
