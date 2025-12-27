import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Star, Calendar, Clock, User, PlayCircle, Sparkles, Film, Palette, Tag } from "lucide-react";
import { Badge } from "./ui/badge";
import { TrailerPlayer } from "./TrailerPlayer";
import { haptics } from "../lib/haptics";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

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
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    border: "border-amber-500/30",
    icon: null,
  },
  fair: {
    color: "text-white/60",
    bg: "bg-white/10",
    border: "border-white/10",
    icon: null,
  },
};

/**
 * Movie detail dialog using shadcn Dialog
 * Unified component for all devices
 */
export function MovieModal({ movie, onClose, onMoreLikeThis }) {
  // Cache movie data so we can render during exit animation
  const [isOpen, setIsOpen] = useState(false);
  const cachedMovie = useRef(null);

  // Update cached movie and open state when movie changes
  useEffect(() => {
    if (movie) {
      cachedMovie.current = movie;
      setIsOpen(true);
      document.body.style.overflow = 'hidden';
    }
  }, [movie]);

  // Reset scroll on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle close - trigger exit animation, then call onClose
  const handleClose = () => {
    haptics.light();
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  // After exit animation completes, call onClose to clear parent state
  const handleExitComplete = () => {
    onClose();
  };

  // Use cached movie for rendering (persists during exit animation)
  const displayMovie = cachedMovie.current;
  if (!displayMovie) return null;

  // Extract movie data from cached/display movie
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
  } = displayMovie;

  const safeGenres = genres || [];
  const safeVibes = vibes || [];

  const backdropUrl = backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${backdrop_path}`
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

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isOpen && (
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
        >
          <DialogContent
        className="max-w-3xl w-[calc(100vw-2rem)] max-h-[70vh] sm:max-h-[85vh] p-0 gap-0 overflow-hidden bg-[#0a0a0f]/95 backdrop-blur-2xl border border-white/[0.08] rounded-[1.75rem] shadow-2xl shadow-black/50"
      >
        {/* Visually hidden title and description for accessibility */}
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          {overview || `Details for ${title}`}
        </DialogDescription>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[70vh] sm:max-h-[85vh]">
          {/* Hero Image Section */}
          <div className="relative overflow-hidden h-48 sm:h-64 md:h-72">
            {backdropUrl && (
              <img
                src={backdropUrl}
                alt={title}
                className="h-full w-full object-cover"
              />
            )}
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/40 to-transparent" />

            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
              <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2 drop-shadow-lg tracking-tight">
                {title}
              </h1>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-white/80">
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
              </div>
            </div>
          </div>

          {/* Match Score Bar */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-5 sm:px-6 py-4 bg-white/[0.02]">
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
          </div>

          {/* Content Sections */}
          <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Overview */}
            <section>
              <h3 className="text-sm font-medium text-white/40 mb-2">
                Overview
              </h3>
              <p className="text-sm leading-relaxed text-white/80">
                {overview || "No overview available."}
              </p>
            </section>

            {/* Two Column Layout for Genres & Vibes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Genres */}
              {safeGenres.length > 0 && (
                <section>
                  <h3 className="text-sm font-medium text-white/40 mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-amber-400" /> Genres
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
                </section>
              )}

              {/* Vibes */}
              {safeVibes.length > 0 && (
                <section>
                  <h3 className="text-sm font-medium text-white/40 mb-2 flex items-center gap-2">
                    <Palette className="h-4 w-4 text-purple-400" /> Vibes
                  </h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {safeVibes.map((v) => (
                      <span key={v} className="text-xs sm:text-sm text-purple-400/90 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                        #{v}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Trailer */}
            {id && (
              <section>
                <h3 className="text-sm font-medium text-white/40 mb-2 flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-amber-400" /> Trailer
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

            {/* Two Column Layout for Cast & Director */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Cast */}
              {topCast.length > 0 && (
                <section>
                  <h3 className="text-sm font-medium text-white/40 mb-2">
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
                </section>
              )}

              {/* Director */}
              {director && (
                <section>
                  <h3 className="text-sm font-medium text-white/40 mb-2">
                    Director
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80">{director}</p>
                </section>
              )}
            </div>

            {/* More Like This Button */}
            {onMoreLikeThis && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    haptics.light();
                    onMoreLikeThis(displayMovie);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.06] border border-white/10 text-white/80 hover:bg-white/[0.1] hover:text-white hover:border-white/20 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  More Like This
                </button>
              </div>
            )}

            {/* Bottom padding */}
            <div className="h-2" />
          </div>
        </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
