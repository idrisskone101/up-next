import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  AnimatePresence,
} from "framer-motion";
import { X, Star, Calendar, Clock, User, PlayCircle, ChevronUp } from "lucide-react";
import { Badge } from "./ui/badge";
import { TrailerPlayer } from "./TrailerPlayer";
import { springConfigs } from "../lib/animations";
import { haptics } from "../lib/haptics";

// Snap points as percentage of viewport height (from bottom)
const SNAP_POINTS = {
  CLOSED: 0,
  PEEK: 45,    // 45% of viewport - shows poster, title, score
  EXPANDED: 92 // 92% of viewport - shows all content
};

// iOS-style spring config for snapping
const snapSpring = {
  type: "spring",
  stiffness: 400,
  damping: 35,
  mass: 0.8
};

/**
 * iOS-style bottom sheet modal for movie/TV show details
 * Features Apple Maps-style snap points and gesture handling
 */
export function MovieModal({ movie, onClose }) {
  const sheetRef = useRef(null);
  const contentRef = useRef(null);
  const controls = useAnimation();

  // Current snap point state
  const [snapPoint, setSnapPoint] = useState(SNAP_POINTS.PEEK);
  const [isDragging, setIsDragging] = useState(false);

  // Motion value for sheet position (0 = closed, 100 = full height)
  const sheetY = useMotionValue(100); // Start off-screen

  // Transform sheet position to visual properties
  const backdropOpacity = useTransform(sheetY, [100, 50, 0], [0, 0.7, 0.9]);
  const sheetHeight = useTransform(sheetY, (y) => `${y}%`);

  // Calculate the snap point to animate to based on velocity and current position
  const getSnapPoint = useCallback((currentY, velocityY) => {
    // Fast swipe down from peek or anywhere -> close
    if (velocityY > 800) return SNAP_POINTS.CLOSED;

    // Fast swipe up -> expand
    if (velocityY < -800) return SNAP_POINTS.EXPANDED;

    // Position-based snapping
    const peekThreshold = (SNAP_POINTS.PEEK + SNAP_POINTS.CLOSED) / 2;
    const expandThreshold = (SNAP_POINTS.EXPANDED + SNAP_POINTS.PEEK) / 2;

    if (currentY < peekThreshold) return SNAP_POINTS.CLOSED;
    if (currentY < expandThreshold) return SNAP_POINTS.PEEK;
    return SNAP_POINTS.EXPANDED;
  }, []);

  // Animate to a snap point
  const snapTo = useCallback(async (point) => {
    if (point === SNAP_POINTS.CLOSED) {
      haptics.medium();
      await controls.start({ height: "0%" }, snapSpring);
      onClose();
    } else {
      if (point !== snapPoint) {
        haptics.snap();
      }
      setSnapPoint(point);
      await controls.start({ height: `${point}%` }, snapSpring);
    }
  }, [controls, onClose, snapPoint]);

  // Initial animation - slide up to peek position
  useEffect(() => {
    controls.start({ height: `${SNAP_POINTS.PEEK}%` }, snapSpring);
    setSnapPoint(SNAP_POINTS.PEEK);
  }, [controls]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") snapTo(SNAP_POINTS.CLOSED);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [snapTo]);

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

  // Handle drag
  const handleDrag = (event, info) => {
    setIsDragging(true);
  };

  // Handle drag end - snap to nearest point
  const handleDragEnd = (event, info) => {
    setIsDragging(false);

    // Get current height as percentage
    const sheetElement = sheetRef.current;
    if (!sheetElement) return;

    const currentHeight = (sheetElement.offsetHeight / window.innerHeight) * 100;
    const newSnapPoint = getSnapPoint(currentHeight, info.velocity.y);

    snapTo(newSnapPoint);
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

  const isPeek = snapPoint === SNAP_POINTS.PEEK;
  const isExpanded = snapPoint === SNAP_POINTS.EXPANDED;

  return createPortal(
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50 bg-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => snapTo(SNAP_POINTS.CLOSED)}
      />

      {/* Bottom Sheet */}
      <motion.div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col overflow-hidden rounded-t-[28px] bg-slate-900/95 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        initial={{ height: "0%" }}
        animate={controls}
        exit={{ height: "0%" }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.1, bottom: 0.3 }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{
          maxHeight: "92dvh",
          touchAction: "none"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero Image Section - Always visible, with rounded top corners */}
        <div className="relative flex-shrink-0 h-[35%] min-h-[180px] overflow-hidden rounded-t-[28px]">
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
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-transparent" />

          {/* Drag Handle - Floating on top of image */}
          <div className="absolute top-0 left-0 right-0 flex justify-center pt-3 pb-2 z-20">
            <motion.div
              className="w-9 h-1 rounded-full bg-white/40 shadow-sm"
              whileHover={{ backgroundColor: "rgba(255,255,255,0.6)" }}
            />
          </div>

          {/* Close button */}
          <motion.button
            onClick={() => snapTo(SNAP_POINTS.CLOSED)}
            className="absolute right-4 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-md hover:bg-black/60 transition-colors"
            aria-label="Close modal"
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-4 w-4" />
          </motion.button>

          {/* Title overlay on image */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
            <motion.h1
              className="text-2xl font-bold text-white mb-2 drop-shadow-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {title}
            </motion.h1>

            {/* Metadata row */}
            <motion.div
              className="flex items-center gap-2 text-sm text-white/80"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {year}
              </span>
              {runtime_minutes && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {formatRuntime(runtime_minutes)}
                  </span>
                </>
              )}
              {certification && (
                <>
                  <span className="text-white/40">•</span>
                  <Badge variant="outline" className="border-white/30 text-white/80 text-xs py-0 h-5">
                    {certification}
                  </Badge>
                </>
              )}
              <Badge className="bg-cyan-500/90 text-white text-xs py-0 h-5 ml-1">
                {kind === "tv" ? "TV" : "Movie"}
              </Badge>
            </motion.div>
          </div>
        </div>

        {/* Match Score Bar - Always visible */}
        <motion.div
          className="flex-shrink-0 flex items-center gap-4 px-5 py-4 border-b border-white/10 bg-slate-900/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50 uppercase tracking-wider">Match</span>
            <span className="text-xl font-bold text-cyan-400">
              {Math.round(combined_score * 100)}%
            </span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">Signal:</span>
            <Badge
              variant="outline"
              className={`text-xs py-0 h-5 ${
                strongest_signal === 'content' ? 'border-blue-500/50 text-blue-400' :
                strongest_signal === 'vibe' ? 'border-purple-500/50 text-purple-400' :
                'border-orange-500/50 text-orange-400'
              }`}
            >
              {strongest_signal === 'content' ? 'Story' :
               strongest_signal === 'vibe' ? 'Vibe' : 'Details'}
            </Badge>
          </div>

          {/* Expand hint - only in peek mode */}
          <AnimatePresence>
            {isPeek && (
              <motion.button
                className="ml-auto flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
                onClick={() => snapTo(SNAP_POINTS.EXPANDED)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span>Details</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Scrollable Content - Expands when sheet expands */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-safe"
          style={{
            opacity: isPeek ? 0.3 : 1,
            pointerEvents: isPeek ? 'none' : 'auto',
            transition: 'opacity 0.2s ease'
          }}
        >
          <div className="px-5 py-5 space-y-6">
            {/* Overview */}
            <section>
              <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">
                Overview
              </h3>
              <p className="text-sm leading-relaxed text-white/80">
                {overview || "No overview available."}
              </p>
            </section>

            {/* Genres */}
            {safeGenres.length > 0 && (
              <section>
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">
                  Genres
                </h3>
                <div className="flex flex-wrap gap-2">
                  {safeGenres.map((g) => (
                    <Badge
                      key={g}
                      variant="outline"
                      className="border-white/20 text-white/70 text-xs"
                    >
                      {g}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Vibes */}
            {safeVibes.length > 0 && (
              <section>
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">
                  Vibes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {safeVibes.map((v) => (
                    <span key={v} className="text-sm text-cyan-400/80">
                      #{v}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Trailer */}
            {id && isExpanded && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-cyan-400" /> Trailer
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

            {/* Cast */}
            {topCast.length > 0 && (
              <section>
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">
                  Cast
                </h3>
                <ul className="space-y-1.5">
                  {topCast.map((actor, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                      <User className="h-3 w-3 text-white/40" />
                      {actor.name || actor}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Director */}
            {director && (
              <section>
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-1">
                  Director
                </h3>
                <p className="text-sm text-white/80">{director}</p>
              </section>
            )}

            {/* Bottom padding for safe area */}
            <div className="h-4" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
