import { motion } from "framer-motion";
import { Star, Calendar, Clock, User, PlayCircle, Sparkles, Tag } from "lucide-react";
import { Badge } from "./ui/badge";
import { TrailerPlayer } from "./TrailerPlayer";
import { haptics } from "../lib/haptics";
import {
  drawerContentContainerVariants,
  drawerContentItemVariants,
  prefersReducedMotion,
  springConfigs,
} from "../lib/animations";

const formatRuntime = (minutes) => {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

/**
 * Shared movie detail content sections
 * Used by both MovieDrawer and potential bottom sheet
 */
export function MovieDetail({ movie, onMoreLikeThis }) {
  const {
    id,
    title,
    kind,
    release_date,
    overview,
    genres,
    director,
    cast,
    vote_average,
    certification,
    runtime_minutes,
    poster_path,
    backdrop_path,
  } = movie;

  const safeGenres = genres || [];

  const backdropUrl = backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${backdrop_path}`
    : poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : null;

  const year = release_date ? new Date(release_date).getFullYear() : "N/A";

  const parsedCast = typeof cast === "string" ? JSON.parse(cast) : cast;
  const topCast = Array.isArray(parsedCast) ? parsedCast.slice(0, 5) : [];

  const reducedMotion = prefersReducedMotion();

  return (
    <motion.div
      variants={reducedMotion ? {} : drawerContentContainerVariants}
      initial={reducedMotion ? { opacity: 1 } : "hidden"}
      animate={reducedMotion ? { opacity: 1 } : "visible"}
      className="flex flex-col h-full"
    >
      {/* Hero Image Zone */}
      <motion.div
        variants={drawerContentItemVariants}
        className="relative h-52 lg:h-60 shrink-0 overflow-hidden"
      >
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121218] via-[#121218]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#121218]/40 to-transparent" />

        {/* Title overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
          <h1 className="text-xl lg:text-2xl font-semibold text-white mb-2 drop-shadow-lg tracking-tight font-heading">
            {title}
          </h1>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-white/60" /> {year}
            </span>
            {runtime_minutes && (
              <>
                <span className="text-white/30">|</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-white/60" /> {formatRuntime(runtime_minutes)}
                </span>
              </>
            )}
            {vote_average && (
              <>
                <span className="text-white/30">|</span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-current" /> {vote_average.toFixed(1)}
                </span>
              </>
            )}
            {certification && (
              <>
                <span className="text-white/30">|</span>
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
      </motion.div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Overview */}
        <motion.section variants={drawerContentItemVariants}>
          <h3 className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">
            Overview
          </h3>
          <p className="text-sm leading-relaxed text-white/80">
            {overview || "No overview available."}
          </p>
        </motion.section>

        {/* Genres */}
        {safeGenres.length > 0 && (
          <motion.section variants={drawerContentItemVariants}>
            <h3 className="text-xs font-medium text-white/40 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
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

        {/* Trailer */}
        {id && (
          <motion.section variants={drawerContentItemVariants}>
            <h3 className="text-xs font-medium text-white/40 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
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

        {/* Two Column Layout for Cast & Director */}
        <motion.div variants={drawerContentItemVariants} className="grid grid-cols-2 gap-4">
          {/* Cast */}
          {topCast.length > 0 && (
            <section>
              <h3 className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">
                Cast
              </h3>
              <ul className="space-y-1">
                {topCast.map((actor, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-white/70">
                    <User className="h-3 w-3 text-white/40 shrink-0" />
                    <span className="truncate">{actor.name || actor}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Director */}
          {director && (
            <section>
              <h3 className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">
                Director
              </h3>
              <p className="text-xs text-white/80">{director}</p>
            </section>
          )}
        </motion.div>

        {/* More Like This Button */}
        {onMoreLikeThis && (
          <motion.div variants={reducedMotion ? {} : drawerContentItemVariants} className="pt-2 pb-4">
            <motion.button
              onClick={() => {
                haptics.light();
                onMoreLikeThis(movie);
              }}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-shadow"
              whileHover={reducedMotion ? {} : { scale: 1.02, y: -1 }}
              whileTap={reducedMotion ? {} : { scale: 0.98 }}
              transition={reducedMotion ? { duration: 0 } : springConfigs.snappy}
            >
              <Sparkles className="w-4 h-4" />
              More Like This
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
