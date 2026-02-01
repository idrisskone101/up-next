import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Film, Star, Sparkles, Tv } from "lucide-react";
import {
  use3DTilt,
  prefersReducedMotion,
} from "../lib/animations";
import { haptics } from "../lib/haptics";
import { useIsMobile } from "../hooks/useMediaQuery";

// Match score tier styling
const getMatchTier = (score) => {
  if (!score) return null;
  if (score >= 70) return {
    label: "Excellent",
    bg: "bg-gradient-to-r from-brand-golden to-yellow-400",
    text: "text-amber-900",
    glow: "shadow-[0_0_16px_rgba(238,199,69,0.5)]",
    icon: true,
  };
  if (score >= 50) return {
    label: "Good",
    bg: "bg-gradient-to-r from-brand-orange to-red-400",
    text: "text-white",
    glow: "shadow-[0_0_12px_rgba(224,74,40,0.4)]",
    icon: false,
  };
  return {
    label: "Fair",
    bg: "bg-gray-200",
    text: "text-gray-600",
    glow: "",
    icon: false,
  };
};

/**
 * Individual movie/TV show card component with bouncy animations, 3D tilt effect,
 * and info overlay on hover
 */
export function MovieCard({
  movie,
  onClick,
  onPlayTrailer,
  index = 0,
  isSelected = false,
  isDimmed = false,
}) {
  const {
    title,
    kind,
    release_date,
    vote_average,
    poster_path,
    match_score,
  } = movie;

  // Get match tier styling
  const matchTier = getMatchTier(match_score);

  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const { handleMouseMove, handleMouseLeave } = use3DTilt(cardRef, 5);
  const isMobile = useIsMobile();

  // Check reduced motion preference
  const reducedMotion = prefersReducedMotion();

  // Disable hover effects on mobile
  const disableHover = reducedMotion || isMobile;

  const posterUrl = poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : null;

  const year = release_date ? new Date(release_date).getFullYear() : "N/A";

  // Preload backdrop image on hover for instant modal display
  useEffect(() => {
    if (isHovered && movie.backdrop_path) {
      const img = new Image();
      img.src = `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
    }
  }, [isHovered, movie.backdrop_path]);

  const handleClick = (e) => {
    haptics.light();
    onClick?.(e);
  };

  return (
    <motion.div
      className="relative"
      style={{
        zIndex: isHovered ? 50 : 10,
        isolation: "isolate",
      }}
      onHoverStart={() => !isMobile && setIsHovered(true)}
      onHoverEnd={() => {
        if (!isMobile) {
          setIsHovered(false);
          handleMouseLeave();
        }
      }}
    >
      <motion.div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick(e);
          }
        }}
        whileHover={
          disableHover
            ? {}
            : {
                y: -4,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                },
              }
        }
        whileTap={disableHover ? {} : { scale: 0.98, transition: { duration: 0.1 } }}
        className="group relative flex w-full flex-col gap-2 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-golden focus-visible:ring-offset-2 focus-visible:ring-offset-background perspective-1000"
        style={{
          opacity: isDimmed ? 0.5 : 1,
          filter: isDimmed ? "brightness(0.7)" : "none",
          transition: "opacity 0.25s ease, filter 0.25s ease",
        }}
      >
        {/* Poster Container with 3D Tilt + Warm Glow */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-gradient-to-br from-brand-cream/30 to-gray-200 tilt-card transition-shadow duration-200 ease-out ${
            isHovered && !disableHover
              ? "shadow-[0_12px_24px_-8px_rgba(0,0,0,0.2)]"
              : "shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)]"
          }`}
        >
          {/* Poster */}
          <div className="relative h-full w-full rounded-xl overflow-hidden">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={title}
                className="h-full w-full object-cover transition-transform duration-200"
                loading="lazy"
                style={{
                  transform: !disableHover && isHovered ? "scale(1.02)" : "scale(1)",
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400 bg-gray-200">
                <Film className="h-8 w-8 sm:h-12 sm:w-12" />
              </div>
            )}
          </div>

          {/* Subtle border */}
          <div className="absolute inset-0 rounded-xl pointer-events-none ring-1 ring-black/5" />

          {/* Type Badge - Top Left */}
          <div className="absolute left-1.5 top-1.5 sm:left-2 sm:top-2 z-20">
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm shadow-sm ${
                kind === "tv"
                  ? "bg-brand-orange/90 text-white"
                  : "bg-brand-golden text-amber-900"
              }`}
            >
              {kind === "tv" ? (
                <Tv className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              ) : (
                <Film className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              )}
              <span>{kind === "tv" ? "TV Show" : "Movie"}</span>
            </div>
          </div>

          {/* Match Score Badge - Top Right */}
          {matchTier && (
            <motion.div
              className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 z-20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
            >
              <div
                className={`${matchTier.bg} ${matchTier.text} ${matchTier.glow} text-[9px] px-2 py-0.5 sm:text-[11px] sm:px-2.5 sm:py-1 font-bold flex items-center gap-1 rounded-md`}
              >
                {matchTier.icon && <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                {match_score}%
              </div>
            </motion.div>
          )}

        </div>

        {/* Content below card */}
        <div className="space-y-1 px-0.5">
          <h3 className="text-sm font-bold leading-tight text-gray-900 line-clamp-1 sm:text-base">
            {title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-gray-600 sm:text-xs">
            <span className="flex items-center gap-1 font-medium">{year}</span>

            {vote_average && (
              <span className="flex items-center gap-1 text-brand-orange font-semibold">
                <Star className="h-2.5 w-2.5 fill-current sm:h-3 sm:w-3" />
                {vote_average.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
