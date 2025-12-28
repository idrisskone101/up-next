import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "./ui/badge";
import { Film, Star, Info, Play } from "lucide-react";
import {
  springConfigs,
  cardVariants,
  use3DTilt,
  cardOverlayVariants,
  cardButtonVariants,
  prefersReducedMotion,
} from "../lib/animations";
import { haptics } from "../lib/haptics";

// Detect touch device to skip hover overlay
const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

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
  } = movie;

  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const { handleMouseMove, handleMouseLeave } = use3DTilt(cardRef, 5);

  // Check reduced motion preference
  const reducedMotion = prefersReducedMotion();

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
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => {
        setIsHovered(false);
        handleMouseLeave();
      }}
    >
      <motion.button
        type="button"
        onClick={handleClick}
        variants={reducedMotion ? {} : cardVariants}
        initial={reducedMotion ? { opacity: 1 } : "hidden"}
        animate={reducedMotion ? { opacity: 1 } : "visible"}
        exit={reducedMotion ? { opacity: 0 } : "exit"}
        whileHover={
          reducedMotion
            ? {}
            : {
                scale: 1.04,
                y: -3,
                transition: {
                  type: "spring",
                  stiffness: 380,
                  damping: 26,
                  mass: 0.6,
                },
              }
        }
        whileTap={reducedMotion ? {} : { scale: 0.97, transition: { duration: 0.08 } }}
        custom={index}
        className="group relative flex w-full flex-col gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background perspective-1000"
        style={{
          opacity: isDimmed ? 0.5 : 1,
          filter: isDimmed ? "brightness(0.7)" : "none",
          transition: "opacity 0.25s ease, filter 0.25s ease",
        }}
      >
        {/* Poster Container with 3D Tilt */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted/30 tilt-card"
        >
          {/* Poster */}
          <div className="relative h-full w-full">
            {posterUrl ? (
              <motion.img
                src={posterUrl}
                alt={title}
                className="h-full w-full object-cover"
                loading="lazy"
                initial={{ scale: 1 }}
                animate={reducedMotion ? { scale: 1 } : { scale: isHovered ? 1.04 : 1 }}
                transition={reducedMotion ? { duration: 0 } : springConfigs.snappy}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/40 bg-muted/20">
                <Film className="h-8 w-8 sm:h-12 sm:w-12" />
              </div>
            )}
          </div>

          {/* Gradient overlay - always present on hover for info overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }}
          />

          {/* Subtle border */}
          <div className="absolute inset-0 rounded-xl pointer-events-none border border-white/10" />

          {/* Kind Badge */}
          <motion.div
            className="absolute left-1.5 top-1.5 sm:left-2 sm:top-2 hidden xs:block z-20"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springConfigs.bouncy, delay: index * 0.05 + 0.2 }}
          >
            <Badge
              variant="outline"
              className="bg-black/50 backdrop-blur-md border-white/10 text-white/90 uppercase tracking-wider text-[8px] px-1.5 py-0.5 sm:text-[10px] sm:px-2.5 sm:py-1"
            >
              {kind === "tv" ? "TV" : "Movie"}
            </Badge>
          </motion.div>

          {/* Info Overlay - Desktop only, appears on hover */}
          <AnimatePresence mode="wait">
            {!isTouchDevice && isHovered && (
              <motion.div
                className="absolute inset-x-0 bottom-0 p-3 z-30"
                variants={reducedMotion ? {} : cardOverlayVariants}
                initial={reducedMotion ? { opacity: 0 } : "hidden"}
                animate={reducedMotion ? { opacity: 1 } : "visible"}
                exit={reducedMotion ? { opacity: 0 } : "exit"}
              >
                {/* Content */}
                <div className="relative">
                  {/* Title - 1 line, truncate */}
                  <h3 className="text-[15px] font-semibold text-white truncate">
                    {title}
                  </h3>

                  {/* Metadata row */}
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-white/70">
                    <span>{year}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-2.5">
                    <motion.button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        haptics.light();
                        onClick?.();
                      }}
                      className="h-8 w-8 rounded-[10px] bg-amber-500/90 text-amber-950 flex items-center justify-center backdrop-blur-sm hover:bg-amber-400 transition-colors"
                      variants={reducedMotion ? {} : cardButtonVariants}
                      custom={0}
                      initial={reducedMotion ? { opacity: 1 } : "hidden"}
                      animate={reducedMotion ? { opacity: 1 } : "visible"}
                      exit={reducedMotion ? { opacity: 0 } : "exit"}
                      whileHover={reducedMotion ? {} : { scale: 1.08 }}
                      whileTap={reducedMotion ? {} : { scale: 0.95 }}
                    >
                      <Info className="h-4 w-4" />
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        haptics.light();
                        onPlayTrailer?.();
                      }}
                      className="h-8 w-8 rounded-[10px] bg-white/10 border border-white/20 text-white/90 flex items-center justify-center backdrop-blur-sm hover:bg-white/20 transition-colors"
                      variants={reducedMotion ? {} : cardButtonVariants}
                      custom={1}
                      initial={reducedMotion ? { opacity: 1 } : "hidden"}
                      animate={reducedMotion ? { opacity: 1 } : "visible"}
                      exit={reducedMotion ? { opacity: 0 } : "exit"}
                      whileHover={reducedMotion ? {} : { scale: 1.08 }}
                      whileTap={reducedMotion ? {} : { scale: 0.95 }}
                    >
                      <Play className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content below card */}
        <motion.div
          className="space-y-1 px-0.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfigs.bouncy, delay: index * 0.05 + 0.1 }}
        >
          <h3 className="text-sm font-bold leading-tight text-foreground line-clamp-1 sm:text-base">
            {title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground sm:text-xs">
            <span className="flex items-center gap-1">{year}</span>

            {vote_average && (
              <span className="flex items-center gap-1 text-amber-400/90">
                <Star className="h-2.5 w-2.5 fill-current sm:h-3 sm:w-3" />
                {vote_average.toFixed(1)}
              </span>
            )}
          </div>
        </motion.div>
      </motion.button>
    </motion.div>
  );
}
