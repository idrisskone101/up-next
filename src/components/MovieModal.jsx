import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { X, Star, Calendar, Clock, User, PlayCircle, Sparkles, Film, Palette, Tag } from "lucide-react";
import { Badge } from "./ui/badge";
import { TrailerPlayer } from "./TrailerPlayer";
import { haptics } from "../lib/haptics";

/**
 * Get match tier for styling
 */
const getMatchTier = (score) => {
  const percentage = Math.round(score * 100);
  if (percentage >= 70) return "excellent";
  if (percentage >= 50) return "good";
  return "fair";
};

const tierConfig = {
  excellent: {
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    border: "border-amber-500/30",
    icon: Sparkles,
  },
  good: {
    color: "text-cyan-400",
    bg: "bg-cyan-500/20",
    border: "border-cyan-500/30",
    icon: null,
  },
  fair: {
    color: "text-white/60",
    bg: "bg-white/10",
    border: "border-white/10",
    icon: null,
  },
};

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// Desktop: scale + fade centered modal
const desktopModalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

// Mobile: slide up from bottom
const mobileModalVariants = {
  hidden: {
    y: "100%",
    opacity: 0.5,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 35,
    },
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: {
      duration: 0.25,
      ease: "easeIn",
    },
  },
};

// Hook to detect mobile breakpoint
const useIsMobile = () => {
  // Initialize with actual value to prevent flash
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};

/**
 * Responsive modal for movie/TV show details
 * - Mobile: Bottom sheet with drag-to-dismiss
 * - Desktop: Centered modal with scale animation
 */
export function MovieModal({ movie, onClose }) {
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const isMobile = useIsMobile();

  // Drag gesture state for mobile
  const dragY = useMotionValue(0);
  const dragOpacity = useTransform(dragY, [0, 300], [1, 0.5]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        haptics.light();
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      haptics.light();
      onClose();
    }
  };

  // Handle drag end for mobile swipe-to-dismiss
  const handleDragEnd = (e, info) => {
    const threshold = 120;
    const velocity = 500;

    if (info.offset.y > threshold || info.velocity.y > velocity) {
      haptics.medium();
      onClose();
    } else {
      haptics.light();
    }
  };

  // Extract movie data
  const {
    id,
    title,
    kind,
    release_date,
    overview,
    genres,
    vibes,
    director,
    cast,
    vote_average,
    certification,
    runtime_minutes,
    poster_path,
    backdrop_path,
    combined_score,
    strongest_signal,
  } = movie;

  const safeGenres = genres || [];
  const safeVibes = vibes || [];

  const backdropUrl = backdrop_path
    ? `https://image.tmdb.org/t/p/original${backdrop_path}`
    : poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : null;

  const year = release_date ? new Date(release_date).getFullYear() : "N/A";

  const formatRuntime = (minutes) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const parsedCast = typeof cast === "string" ? JSON.parse(cast) : cast;
  const topCast = Array.isArray(parsedCast) ? parsedCast.slice(0, 5) : [];

  const matchTier = getMatchTier(combined_score);
  const tier = tierConfig[matchTier];
  const TierIcon = tier.icon;
  const matchPercentage = Math.round(combined_score * 100);

  return createPortal(
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.2 }}
        onClick={handleBackdropClick}
      />

      {/* Modal Container - Responsive positioning */}
      <motion.div
        className={`fixed z-50 ${
          isMobile
            ? "inset-x-0 bottom-0 top-auto"
            : "inset-0 flex items-center justify-center p-6"
        }`}
        onClick={!isMobile ? handleBackdropClick : undefined}
      >
        {/* Modal Content */}
        <motion.div
          ref={modalRef}
          className={`relative w-full bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 border border-white/10 ${
            isMobile
              ? "rounded-t-3xl max-h-[92dvh]"
              : "max-w-3xl max-h-[90vh] rounded-2xl"
          }`}
          style={isMobile ? { y: dragY, opacity: dragOpacity } : undefined}
          variants={isMobile ? mobileModalVariants : desktopModalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          drag={isMobile ? "y" : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          onDragEnd={isMobile ? handleDragEnd : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile: Sticky Header with Drag Handle */}
          {isMobile && (
            <div className="sticky top-0 z-30 pt-safe-top bg-slate-900/90 backdrop-blur-md border-b border-white/5 rounded-t-3xl">
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-9 h-1 rounded-full bg-white/30" />
              </div>

              {/* Header with Close Button */}
              <div className="flex items-center justify-between px-4 pb-3">
                <h2 className="text-lg font-semibold text-white truncate pr-4">
                  {title}
                </h2>
                <motion.button
                  onClick={() => {
                    haptics.light();
                    onClose();
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 active:bg-white/20 transition-colors"
                  aria-label="Close modal"
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
          )}

          {/* Desktop: Floating Close Button */}
          {!isMobile && (
            <motion.button
              onClick={() => {
                haptics.light();
                onClose();
              }}
              className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-md hover:bg-black/70 hover:text-white transition-colors"
              aria-label="Close modal"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}

          {/* Scrollable Content */}
          <div
            ref={contentRef}
            className={`overflow-y-auto overflow-x-hidden ${
              isMobile
                ? "max-h-[calc(92dvh-80px)]"
                : "max-h-[90vh]"
            }`}
          >
            {/* Hero Image Section */}
            <div className={`relative overflow-hidden ${
              isMobile ? "h-40" : "h-48 sm:h-64 md:h-72"
            }`}>
              {backdropUrl && (
                <motion.img
                  src={backdropUrl}
                  alt={title}
                  className="h-full w-full object-cover"
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
              )}
              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 to-transparent" />

              {/* Title overlay - only on desktop (mobile has sticky header) */}
              {!isMobile && (
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
                  <motion.h1
                    className="text-2xl sm:text-3xl font-display font-semibold text-white mb-2 drop-shadow-lg tracking-tight"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {title}
                  </motion.h1>

                  {/* Metadata row */}
                  <motion.div
                    className="flex flex-wrap items-center gap-2 text-sm text-white/80"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-white/60" /> {year}
                    </span>
                    {runtime_minutes && (
                      <>
                        <span className="text-white/30">•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-white/60" /> {formatRuntime(runtime_minutes)}
                        </span>
                      </>
                    )}
                    {vote_average && (
                      <>
                        <span className="text-white/30">•</span>
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star className="h-3.5 w-3.5 fill-current" /> {vote_average.toFixed(1)}
                        </span>
                      </>
                    )}
                    {certification && (
                      <>
                        <span className="text-white/30">•</span>
                        <Badge variant="outline" className="border-white/20 text-white/70 text-xs py-0 h-5 bg-black/20">
                          {certification}
                        </Badge>
                      </>
                    )}
                    <Badge className="bg-amber-500/90 text-amber-950 text-xs py-0 h-5 ml-1 font-medium">
                      {kind === "tv" ? "TV" : "Movie"}
                    </Badge>
                  </motion.div>
                </div>
              )}

              {/* Mobile: Metadata row below hero */}
              {isMobile && (
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                  <motion.div
                    className="flex flex-wrap items-center gap-2 text-xs text-white/80"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-white/60" /> {year}
                    </span>
                    {runtime_minutes && (
                      <>
                        <span className="text-white/30">•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-white/60" /> {formatRuntime(runtime_minutes)}
                        </span>
                      </>
                    )}
                    {vote_average && (
                      <>
                        <span className="text-white/30">•</span>
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star className="h-3 w-3 fill-current" /> {vote_average.toFixed(1)}
                        </span>
                      </>
                    )}
                    {certification && (
                      <>
                        <span className="text-white/30">•</span>
                        <Badge variant="outline" className="border-white/20 text-white/70 text-[10px] py-0 h-4 bg-black/20">
                          {certification}
                        </Badge>
                      </>
                    )}
                    <Badge className="bg-amber-500/90 text-amber-950 text-[10px] py-0 h-4 font-medium">
                      {kind === "tv" ? "TV" : "Movie"}
                    </Badge>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Match Score Bar */}
            <motion.div
              className="flex flex-wrap items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-slate-900/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Match Score with Tier Styling */}
              <div className={`flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full ${tier.bg} ${tier.border} border`}>
                {TierIcon && <TierIcon className={`h-3.5 sm:h-4 w-3.5 sm:w-4 ${tier.color}`} />}
                <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">Match</span>
                <span className={`text-lg sm:text-xl font-bold ${tier.color}`}>
                  {matchPercentage}%
                </span>
              </div>

              <div className="h-5 sm:h-6 w-px bg-white/10 hidden sm:block" />

              {/* Signal indicator with icons */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs text-white/40 hidden sm:inline">Why matched:</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] sm:text-xs py-0.5 h-5 sm:h-6 flex items-center gap-1 sm:gap-1.5 ${
                    strongest_signal === 'content' ? 'border-blue-500/40 text-blue-400 bg-blue-500/10' :
                    strongest_signal === 'vibe' ? 'border-purple-500/40 text-purple-400 bg-purple-500/10' :
                    'border-amber-500/40 text-amber-400 bg-amber-500/10'
                  }`}
                >
                  {strongest_signal === 'content' && <Film className="h-2.5 sm:h-3 w-2.5 sm:w-3" />}
                  {strongest_signal === 'vibe' && <Palette className="h-2.5 sm:h-3 w-2.5 sm:w-3" />}
                  {strongest_signal === 'metadata' && <Tag className="h-2.5 sm:h-3 w-2.5 sm:w-3" />}
                  {strongest_signal === 'content' ? 'Story' :
                   strongest_signal === 'vibe' ? 'Vibe' : 'Details'}
                </Badge>
              </div>
            </motion.div>

            {/* Content Sections */}
            <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
              {/* Overview */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h3 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider mb-2">
                  Overview
                </h3>
                <p className="text-sm leading-relaxed text-white/80">
                  {overview || "No overview available."}
                </p>
              </motion.section>

              {/* Two Column Layout for Genres & Vibes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Genres */}
                {safeGenres.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Tag className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-amber-400" /> Genres
                    </h3>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {safeGenres.map((g) => (
                        <Badge
                          key={g}
                          variant="outline"
                          className="border-amber-500/20 text-amber-400/90 text-[10px] sm:text-xs bg-amber-500/10"
                        >
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </motion.section>
                )}

                {/* Vibes */}
                {safeVibes.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <h3 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Palette className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-purple-400" /> Vibes
                    </h3>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {safeVibes.map((v) => (
                        <span key={v} className="text-xs sm:text-sm text-purple-400/90 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                          #{v}
                        </span>
                      ))}
                    </div>
                  </motion.section>
                )}
              </div>

              {/* Trailer */}
              {id && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <PlayCircle className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-amber-400" /> Trailer
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
                    <TrailerPlayer
                      tmdbId={id}
                      mediaType={kind === "tv" ? "tv" : "movie"}
                      title={title}
                    />
                  </div>
                </motion.section>
              )}

              {/* Two Column Layout for Cast & Director */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Cast */}
                {topCast.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                  >
                    <h3 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider mb-2">
                      Cast
                    </h3>
                    <ul className="space-y-1 sm:space-y-1.5">
                      {topCast.map((actor, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-white/70">
                          <User className="h-3 w-3 text-white/40" />
                          {actor.name || actor}
                        </li>
                      ))}
                    </ul>
                  </motion.section>
                )}

                {/* Director */}
                {director && (
                  <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h3 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider mb-2">
                      Director
                    </h3>
                    <p className="text-xs sm:text-sm text-white/80">{director}</p>
                  </motion.section>
                )}
              </div>

              {/* Bottom safe area padding for mobile */}
              <div className={isMobile ? "h-safe-bottom pb-4" : "h-2"} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>,
    document.body
  );
}
