import { motion } from "framer-motion";
import { Star, Calendar, Clock, User, PlayCircle, Sparkles, Film, Palette, Tag, X } from "lucide-react";
import { haptics } from "../lib/haptics";
import { Badge } from "./ui/badge";
import { TrailerPlayer } from "./TrailerPlayer";
import { BottomSheet } from "./BottomSheet";

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

// Stagger animation for sections
const sectionVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 + i * 0.05,
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
};

/**
 * Mobile-optimized movie detail sheet
 * Uses BottomSheet for iOS-style presentation
 */
export function MovieDetailSheet({ movie, onClose }) {
  if (!movie) return null;

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
    ? `https://image.tmdb.org/t/p/w780${backdrop_path}`
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
    <BottomSheet isOpen={!!movie} onClose={onClose}>
      {/* Hero Image - Flush with rounded corners */}
      <div className="relative h-36 overflow-hidden rounded-t-3xl -mt-3">
        {backdropUrl && (
          <motion.img
            src={backdropUrl}
            alt={title}
            className="h-full w-full object-cover"
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/20 to-transparent" />
        {/* Close button */}
        <motion.button
          onClick={() => {
            haptics.light();
            onClose();
          }}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:bg-black/70 hover:text-white transition-colors z-10"
          whileTap={{ scale: 0.9 }}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Title & Metadata */}
      <div className="px-5 -mt-4 relative">
        <motion.h1
          className="text-xl font-display font-semibold text-white mb-1.5 drop-shadow-lg tracking-tight"
          custom={0}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          {title}
        </motion.h1>

        <motion.div
          className="flex flex-wrap items-center gap-1.5 text-xs text-white/70"
          custom={1}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-white/50" /> {year}
          </span>
          {runtime_minutes && (
            <>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-white/50" /> {formatRuntime(runtime_minutes)}
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
              <Badge variant="outline" className="border-white/20 text-white/60 text-[10px] py-0 h-4 bg-black/20">
                {certification}
              </Badge>
            </>
          )}
          <Badge className="bg-amber-500/90 text-amber-950 text-[10px] py-0 h-4 ml-0.5 font-medium">
            {kind === "tv" ? "TV" : "Movie"}
          </Badge>
        </motion.div>
      </div>

      {/* Match Score Bar */}
      <motion.div
        className="flex flex-wrap items-center gap-3 px-5 py-3 mt-3 border-y border-white/10 bg-slate-900/50"
        custom={2}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        {/* Match Score */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${tier.bg} ${tier.border} border`}>
          {TierIcon && <TierIcon className={`h-3.5 w-3.5 ${tier.color}`} />}
          <span className="text-[10px] text-white/50 uppercase tracking-wider">Match</span>
          <span className={`text-lg font-bold ${tier.color}`}>
            {matchPercentage}%
          </span>
        </div>

        {/* Signal indicator */}
        <Badge
          variant="outline"
          className={`text-[10px] py-0.5 h-5 flex items-center gap-1 ${
            strongest_signal === 'content' ? 'border-blue-500/40 text-blue-400 bg-blue-500/10' :
            strongest_signal === 'vibe' ? 'border-purple-500/40 text-purple-400 bg-purple-500/10' :
            'border-amber-500/40 text-amber-400 bg-amber-500/10'
          }`}
        >
          {strongest_signal === 'content' && <Film className="h-2.5 w-2.5" />}
          {strongest_signal === 'vibe' && <Palette className="h-2.5 w-2.5" />}
          {strongest_signal === 'metadata' && <Tag className="h-2.5 w-2.5" />}
          {strongest_signal === 'content' ? 'Story' :
           strongest_signal === 'vibe' ? 'Vibe' : 'Details'}
        </Badge>
      </motion.div>

      {/* Content Sections */}
      <div className="px-5 py-4 space-y-5">
        {/* Overview */}
        <motion.section custom={3} initial="hidden" animate="visible" variants={sectionVariants}>
          <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5">
            Overview
          </h3>
          <p className="text-sm leading-relaxed text-white/80">
            {overview || "No overview available."}
          </p>
        </motion.section>

        {/* Genres */}
        {safeGenres.length > 0 && (
          <motion.section custom={4} initial="hidden" animate="visible" variants={sectionVariants}>
            <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="h-3 w-3 text-amber-400" /> Genres
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {safeGenres.map((g) => (
                <Badge
                  key={g}
                  variant="outline"
                  className="border-amber-500/20 text-amber-400/90 text-[10px] bg-amber-500/10"
                >
                  {g}
                </Badge>
              ))}
            </div>
          </motion.section>
        )}

        {/* Vibes */}
        {safeVibes.length > 0 && (
          <motion.section custom={5} initial="hidden" animate="visible" variants={sectionVariants}>
            <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Palette className="h-3 w-3 text-purple-400" /> Vibes
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {safeVibes.map((v) => (
                <span key={v} className="text-[10px] text-purple-400/90 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  #{v}
                </span>
              ))}
            </div>
          </motion.section>
        )}

        {/* Trailer */}
        {id && (
          <motion.section custom={6} initial="hidden" animate="visible" variants={sectionVariants}>
            <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <PlayCircle className="h-3 w-3 text-amber-400" /> Trailer
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

        {/* Cast & Director Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Cast */}
          {topCast.length > 0 && (
            <motion.section custom={7} initial="hidden" animate="visible" variants={sectionVariants}>
              <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5">
                Cast
              </h3>
              <ul className="space-y-1">
                {topCast.map((actor, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-white/70">
                    <User className="h-2.5 w-2.5 text-white/40" />
                    {actor.name || actor}
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

          {/* Director */}
          {director && (
            <motion.section custom={8} initial="hidden" animate="visible" variants={sectionVariants}>
              <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5">
                Director
              </h3>
              <p className="text-xs text-white/80">{director}</p>
            </motion.section>
          )}
        </div>

        {/* Bottom padding for safe area */}
        <div className="h-6 pb-safe" />
      </div>
    </BottomSheet>
  );
}
