import { motion } from "framer-motion";
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

/**
 * Movie detail dialog using shadcn Dialog
 * Unified component for all devices
 */
export function MovieModal({ movie, onClose }) {
  if (!movie) return null;

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

  return (
    <Dialog
      open={!!movie}
      onOpenChange={(open) => {
        if (!open) {
          haptics.light();
          onClose();
        }
      }}
    >
      <DialogContent
        className="max-w-3xl w-[calc(100vw-2rem)] max-h-[70vh] sm:max-h-[85vh] p-0 gap-0 overflow-hidden bg-slate-900/95 backdrop-blur-xl border-white/10 rounded-2xl shadow-2xl shadow-black/50"
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

            {/* Title overlay */}
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

            {/* Bottom padding */}
            <div className="h-2" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
