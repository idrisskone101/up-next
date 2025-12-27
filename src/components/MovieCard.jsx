import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Badge } from "./ui/badge";
import { Film, Star, Sparkles } from "lucide-react";
import {
  springConfigs,
  cardVariants,
  cardHoverVariants,
  badgeVariants,
  use3DTilt,
} from "../lib/animations";
import { haptics } from "../lib/haptics";

/**
 * Get match tier based on percentage
 * Excellent: 70%+ (gold glow, prominent)
 * Good: 50-69% (cyan accent)
 * Fair: <50% (muted)
 */
const getMatchTier = (percentage) => {
  if (percentage >= 70) return "excellent";
  if (percentage >= 50) return "good";
  return "fair";
};

/**
 * Tier-specific styling configurations
 */
const tierStyles = {
  excellent: {
    badgeBg: "bg-gradient-to-r from-amber-500/90 to-yellow-400/90",
    badgeText: "text-amber-950",
    badgeBorder: "border-amber-300/50",
    glowColor: "rgba(251, 191, 36, 0.35)",
    borderColor: "rgba(251, 191, 36, 0.6)",
    hoverBorderColor: "rgba(251, 191, 36, 0.8)",
  },
  good: {
    badgeBg: "bg-amber-600/80",
    badgeText: "text-white",
    badgeBorder: "border-amber-500/30",
    glowColor: "rgba(245, 158, 11, 0.2)",
    borderColor: "rgba(245, 158, 11, 0.35)",
    hoverBorderColor: "rgba(245, 158, 11, 0.5)",
  },
  fair: {
    badgeBg: "bg-white/10",
    badgeText: "text-white/70",
    badgeBorder: "border-white/10",
    glowColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    hoverBorderColor: "rgba(255, 255, 255, 0.15)",
  },
};

/**
 * Individual movie/TV show card component with bouncy animations, 3D tilt effect,
 * and match tier visual hierarchy
 */
export function MovieCard({ movie, onClick, index = 0 }) {
  const {
    id,
    title,
    kind,
    release_date,
    vote_average,
    poster_path,
    combined_score,
    reranked_score,
  } = movie;

  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const { handleMouseMove, handleMouseLeave } = use3DTilt(cardRef, 5);

  const posterUrl = poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : null;

  const year = release_date ? new Date(release_date).getFullYear() : "N/A";
  // Use calibrated reranked_score if available, else raw combined_score
  const displayScore = reranked_score ?? combined_score ?? 0;
  const matchPercentage = Math.round(displayScore * 100);
  const matchTier = getMatchTier(matchPercentage);
  const tierStyle = tierStyles[matchTier];

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
    <motion.button
      type="button"
      onClick={handleClick}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ scale: 1.03, y: -2, transition: { type: "spring", stiffness: 400, damping: 25, mass: 0.5 } }}
      whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
      custom={index}
      className="group relative flex w-full flex-col gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background perspective-1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        handleMouseLeave();
      }}
    >
      {/* Poster Container with 3D Tilt */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted/30 tilt-card"
      >
        {/* Tier-based glow effect */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{
            opacity: isHovered ? 1 : matchTier === "excellent" ? 0.6 : 0,
            boxShadow: isHovered
              ? `0 0 25px ${tierStyle.glowColor}, 0 0 50px ${tierStyle.glowColor}`
              : matchTier === "excellent"
              ? `0 0 20px ${tierStyle.glowColor}`
              : "none",
          }}
          transition={springConfigs.snappy}
        />

        {/* Poster */}
        <div className="relative h-full w-full">
          {posterUrl ? (
            <motion.img
              src={posterUrl}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
              initial={{ scale: 1 }}
              animate={{ scale: isHovered ? 1.03 : 1 }}
              transition={springConfigs.snappy}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/40 bg-muted/20">
              <Film className="h-8 w-8 sm:h-12 sm:w-12" />
            </div>
          )}
        </div>

        {/* Gradient overlay on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />

        {/* Tier-based border glow */}
        <motion.div
          className={`absolute inset-0 rounded-xl pointer-events-none ${
            matchTier === "excellent" ? "border-2" : "border"
          }`}
          initial={{ borderColor: tierStyle.borderColor }}
          animate={{
            borderColor: isHovered
              ? tierStyle.hoverBorderColor
              : tierStyle.borderColor,
          }}
          transition={springConfigs.snappy}
        />

        {/* Match Badge - Tier-based styling */}
        {matchPercentage > 0 && (
          <motion.div
            className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 z-20"
            variants={badgeVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
          >
            <Badge
              variant="secondary"
              className={`backdrop-blur-md shadow-xl font-bold ${tierStyle.badgeBg} ${tierStyle.badgeText} ${tierStyle.badgeBorder} ${
                matchTier === "excellent"
                  ? "text-xs px-2 py-0.5 sm:text-sm sm:px-3 sm:py-1"
                  : "text-[10px] px-1.5 py-0.5 sm:text-xs sm:px-2.5 sm:py-1"
              }`}
            >
              <span className="flex items-center gap-1">
                {matchTier === "excellent" && (
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                )}
                {matchPercentage}%
              </span>
            </Badge>
          </motion.div>
        )}

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
      </div>

      {/* Content */}
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
          <span className="flex items-center gap-1">
            {year}
          </span>

          {vote_average && (
            <span className="flex items-center gap-1 text-amber-400/90">
              <Star className="h-2.5 w-2.5 fill-current sm:h-3 sm:w-3" />
              {vote_average.toFixed(1)}
            </span>
          )}
        </div>
      </motion.div>
    </motion.button>
  );
}
