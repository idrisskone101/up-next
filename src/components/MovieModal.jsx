import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { X, Star, Calendar, Clock, User, PlayCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { TrailerPlayer } from "./TrailerPlayer";
import {
  springConfigs,
  modalVariants,
  backdropVariants,
  contentContainerVariants,
  contentItemVariants,
} from "../lib/animations";

/**
 * Modal component for expanded movie/TV show details with swipe-to-dismiss and bouncy animations
 */
export function MovieModal({ movie, onClose }) {
  const modalRef = useRef(null);
  const y = useMotionValue(0);

  // Transform drag distance to opacity and scale
  const backdropOpacity = useTransform(y, [0, 300], [1, 0]);
  const modalScale = useTransform(y, [0, 300], [1, 0.92]);
  const borderRadius = useTransform(y, [0, 100], [24, 40]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Handle drag end
  const handleDragEnd = (event, info) => {
    // Close if dragged down with velocity or past threshold
    if (info.velocity.y > 500 || info.offset.y > 150) {
      onClose();
    }
  };

  const {
    id,
    title,
    kind,
    release_date,
    overview,
    genres,
    vibes,
    themes,
    director,
    cast,
    vote_average,
    certification,
    runtime_minutes,
    poster_path,
    backdrop_path,
    content_score,
    vibe_score,
    metadata_score,
    combined_score,
    strongest_signal,
  } = movie;

  const safeGenres = genres || [];
  const safeVibes = vibes || [];
  const safeThemes = themes || [];

  const posterUrl = poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : null;

  const backdropUrl = backdrop_path
    ? `https://image.tmdb.org/t/p/original${backdrop_path}`
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

  return createPortal(
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Draggable Modal */}
        <motion.div
          ref={modalRef}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={handleDragEnd}
          style={{ y }}
          initial={{ y: "100%", scale: 0.95, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: "100%", scale: 0.95, opacity: 0 }}
          transition={springConfigs.gentle}
          className="relative flex h-[92dvh] w-full flex-col overflow-hidden bg-card shadow-2xl sm:h-[85dvh] sm:max-w-5xl sm:rounded-3xl"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Drag Handle - Mobile indicator */}
          <motion.div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-30 sm:hidden"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springConfigs.bouncy, delay: 0.3 }}
          >
            <div className="w-10 h-1 rounded-full bg-white/40" />
          </motion.div>

          {/* Close Button */}
          <motion.button
            onClick={onClose}
            className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 hover:text-primary transition-colors md:right-6 md:top-6"
            aria-label="Close modal"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springConfigs.bouncy, delay: 0.2 }}
          >
            <X className="h-5 w-5" />
          </motion.button>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* Hero Section */}
            <motion.div
              className="relative h-[40vh] w-full md:h-[50vh]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {backdropUrl ? (
                <>
                  <motion.img
                    src={backdropUrl}
                    alt={title}
                    className="h-full w-full object-cover"
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-card/80 via-transparent to-transparent sm:from-card/40" />
                </>
              ) : (
                <div className="h-full w-full bg-muted/20" />
              )}
            </motion.div>

            {/* Content Body */}
            <motion.div
              className="relative px-4 pb-12 md:px-10"
              variants={contentContainerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex flex-col md:flex-row md:gap-10">
                {/* Floating Poster - Shared Element */}
                <motion.div
                  className="-mt-20 md:-mt-32 lg:-mt-40 relative z-20 flex-shrink-0"
                  variants={contentItemVariants}
                >
                  {posterUrl && (
                    <div className="hidden md:block w-48 overflow-hidden rounded-xl border-4 border-card shadow-2xl lg:w-60">
                      <img
                        src={posterUrl}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </motion.div>

                {/* Main Info */}
                <div className="flex-1 space-y-6 pt-4 md:pt-0">
                  {/* Header */}
                  <motion.div className="space-y-4" variants={contentItemVariants}>
                    {/* Title & Badges */}
                    <div className="space-y-2">
                      <motion.h1
                        className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...springConfigs.bouncy, delay: 0.1 }}
                      >
                        {title}
                      </motion.h1>
                      <motion.div
                        className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...springConfigs.bouncy, delay: 0.15 }}
                      >
                        <span className="flex items-center gap-1 text-white font-medium">
                          <Calendar className="h-4 w-4 text-primary" /> {year}
                        </span>
                        {runtime_minutes && (
                          <>
                            <span className="text-muted-foreground/40">•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />{" "}
                              {formatRuntime(runtime_minutes)}
                            </span>
                          </>
                        )}
                        {certification && (
                          <>
                            <span className="text-muted-foreground/40">•</span>
                            <Badge
                              variant="outline"
                              className="border-white/20 text-xs"
                            >
                              {certification}
                            </Badge>
                          </>
                        )}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Badge
                            variant="secondary"
                            className="bg-primary text-white hover:bg-primary/90 border-none"
                          >
                            {kind === "tv" ? "TV Series" : "Movie"}
                          </Badge>
                        </motion.div>
                      </motion.div>
                    </div>

                    {/* Match Score */}
                    <motion.div
                      className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...springConfigs.bouncy, delay: 0.2 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">
                          Match Score
                        </span>
                        <motion.span
                          className="text-2xl font-bold text-green-400"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ ...springConfigs.wobbly, delay: 0.3 }}
                        >
                          {Math.round(combined_score * 100)}%
                        </motion.span>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">
                          Strongest Signal
                        </div>
                        <div className="flex items-center gap-2">
                          {strongest_signal === "content" && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={springConfigs.bouncy}
                            >
                              <Badge
                                variant="outline"
                                className="border-blue-500/50 text-blue-400"
                              >
                                Story
                              </Badge>
                            </motion.div>
                          )}
                          {strongest_signal === "vibe" && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={springConfigs.bouncy}
                            >
                              <Badge
                                variant="outline"
                                className="border-purple-500/50 text-purple-400"
                              >
                                Vibe
                              </Badge>
                            </motion.div>
                          )}
                          {strongest_signal === "metadata" && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={springConfigs.bouncy}
                            >
                              <Badge
                                variant="outline"
                                className="border-orange-500/50 text-orange-400"
                              >
                                Details
                              </Badge>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Tab-like Layout for details */}
                  <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
                    <div className="space-y-8">
                      {/* Overview */}
                      <motion.section
                        className="space-y-3"
                        variants={contentItemVariants}
                      >
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          Overview
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                          {overview || "No overview available."}
                        </p>
                      </motion.section>

                      {/* Trailer */}
                      {id && (
                        <motion.section
                          className="space-y-3"
                          variants={contentItemVariants}
                        >
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <PlayCircle className="h-5 w-5 text-primary" />{" "}
                            Trailer
                          </h3>
                          <motion.div
                            className="overflow-hidden rounded-xl border border-white/10 bg-black/50"
                            whileHover={{ scale: 1.01 }}
                            transition={springConfigs.snappy}
                          >
                            <TrailerPlayer
                              tmdbId={id}
                              mediaType={kind === "tv" ? "tv" : "movie"}
                              title={title}
                            />
                          </motion.div>
                        </motion.section>
                      )}
                    </div>

                    {/* Sidebar Info */}
                    <motion.div
                      className="space-y-6"
                      variants={contentContainerVariants}
                    >
                      {/* Genres */}
                      {safeGenres.length > 0 && (
                        <motion.div
                          className="space-y-3"
                          variants={contentItemVariants}
                        >
                          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Genres
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {safeGenres.map((g, i) => (
                              <motion.div
                                key={g}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                  ...springConfigs.bouncy,
                                  delay: i * 0.05,
                                }}
                                whileHover={{ scale: 1.05 }}
                              >
                                <Badge
                                  variant="outline"
                                  className="border-white/10 hover:bg-white/5 transition-colors"
                                >
                                  {g}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Vibes */}
                      {safeVibes.length > 0 && (
                        <motion.div
                          className="space-y-3"
                          variants={contentItemVariants}
                        >
                          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Vibes
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {safeVibes.map((v, i) => (
                              <motion.span
                                key={v}
                                className="text-sm text-primary/90"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  ...springConfigs.bouncy,
                                  delay: i * 0.05,
                                }}
                                whileHover={{ scale: 1.05 }}
                              >
                                #{v}
                              </motion.span>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Cast */}
                      {topCast.length > 0 && (
                        <motion.div
                          className="space-y-3"
                          variants={contentItemVariants}
                        >
                          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Cast
                          </h4>
                          <ul className="space-y-2">
                            {topCast.map((actor, i) => (
                              <motion.li
                                key={i}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  ...springConfigs.bouncy,
                                  delay: i * 0.05,
                                }}
                              >
                                <User className="h-3 w-3" />
                                {actor.name || actor}
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      )}

                      {/* Director */}
                      {director && (
                        <motion.div
                          className="space-y-1"
                          variants={contentItemVariants}
                        >
                          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Director
                          </h4>
                          <p className="text-sm text-foreground">{director}</p>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </>,
    document.body
  );
}
