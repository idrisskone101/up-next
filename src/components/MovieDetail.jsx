import { motion } from "framer-motion";
import { Star, Calendar, Clock, User, PlayCircle, Sparkles, Tag } from "lucide-react";
import { Badge } from "./ui/badge";
import { TrailerPlayer } from "./TrailerPlayer";
import { haptics } from "../lib/haptics";
import {
  drawerContentContainerVariants,
  drawerContentItemVariants,
  prefersReducedMotion,
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
  const topCast = Array.isArray(parsedCast) ? parsedCast.slice(0, 8) : [];

  const reducedMotion = prefersReducedMotion();

  return (
    <motion.div
      variants={reducedMotion ? {} : drawerContentContainerVariants}
      initial={reducedMotion ? { opacity: 1 } : "hidden"}
      animate={reducedMotion ? { opacity: 1 } : "visible"}
      className="flex flex-col h-full bg-black"
    >
      {/* Hero Image Zone */}
      <motion.div
        variants={drawerContentItemVariants}
        className="relative h-56 lg:h-64 shrink-0 overflow-hidden"
      >
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt={title}
            className="h-full w-full object-cover object-top"
          />
        )}
        {!backdropUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {/* Title overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3 drop-shadow-2xl tracking-tight font-heading line-clamp-2">
            {title}
          </h1>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-2.5 text-sm">
            <span className="flex items-center gap-1 text-white/90 font-medium">
              <Calendar className="h-3.5 w-3.5 text-white/60" /> {year}
            </span>
            {runtime_minutes && (
              <>
                <span className="text-white/30">•</span>
                <span className="flex items-center gap-1 text-white/90 font-medium">
                  <Clock className="h-3.5 w-3.5 text-white/60" /> {formatRuntime(runtime_minutes)}
                </span>
              </>
            )}
            {vote_average && (
              <>
                <span className="text-white/30">•</span>
                <span className="flex items-center gap-1 text-brand-golden font-bold">
                  <Star className="h-3.5 w-3.5 fill-brand-golden" /> {vote_average.toFixed(1)}
                </span>
              </>
            )}
            <Badge className="bg-brand-golden text-black text-xs py-0.5 px-2.5 h-6 font-bold uppercase">
              {kind === "tv" ? "TV" : "Film"}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Overview */}
        <motion.section variants={drawerContentItemVariants}>
          <h3 className="text-xs font-bold text-brand-golden mb-2 uppercase tracking-widest">
            Synopsis
          </h3>
          <p className="text-sm leading-relaxed text-white/90">
            {overview || "No overview available."}
          </p>
        </motion.section>

        {/* Genres */}
        {safeGenres.length > 0 && (
          <motion.section variants={drawerContentItemVariants}>
            <h3 className="text-xs font-bold text-brand-golden mb-2 flex items-center gap-1.5 uppercase tracking-widest">
              <Tag className="h-3 w-3" /> Genres
            </h3>
            <div className="flex flex-wrap gap-2">
              {safeGenres.map((g, i) => (
                <span key={i} className="text-sm text-white/80 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                  {g}
                </span>
              ))}
            </div>
          </motion.section>
        )}

        {/* Trailer */}
        {id && (
          <motion.section variants={drawerContentItemVariants}>
            <h3 className="text-xs font-bold text-brand-golden mb-2 flex items-center gap-1.5 uppercase tracking-widest">
              <PlayCircle className="h-3 w-3" /> Trailer
            </h3>
            <div className="overflow-hidden rounded-xl border-2 border-white/20 bg-black">
              <TrailerPlayer
                tmdbId={id}
                mediaType={kind === "tv" ? "tv" : "movie"}
                title={title}
              />
            </div>
          </motion.section>
        )}

        {/* Cast - horizontal scroll */}
        {topCast.length > 0 && (
          <motion.section variants={drawerContentItemVariants}>
            <h3 className="text-xs font-bold text-brand-golden mb-2 uppercase tracking-widest">
              Cast
            </h3>
            <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-6 px-6">
              {topCast.map((actor, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/10 rounded-full border border-white/20 shrink-0"
                >
                  <User className="h-3.5 w-3.5 text-white/60" />
                  <span className="text-sm text-white/90 whitespace-nowrap">
                    {actor.name || actor}
                  </span>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Director */}
        {director && (
          <motion.section variants={drawerContentItemVariants}>
            <h3 className="text-xs font-bold text-brand-golden mb-2 uppercase tracking-widest">
              Director
            </h3>
            <p className="text-sm text-white/90">{director}</p>
          </motion.section>
        )}
      </div>

      {/* Sticky "More Like This" Button */}
      {onMoreLikeThis && (
        <div className="shrink-0 px-6 pb-8 pt-4 bg-gradient-to-t from-black via-black to-transparent">
          <motion.button
            onClick={() => {
              haptics.light();
              onMoreLikeThis(movie);
            }}
            className="w-full h-14 flex items-center justify-center gap-2 rounded-full bg-brand-golden text-black font-bold uppercase tracking-wide transition-all duration-200 hover:bg-brand-golden/90 hover:shadow-[0_0_30px_rgba(238,199,69,0.4)] active:scale-[0.98]"
            whileHover={reducedMotion ? {} : { scale: 1.02, y: -1 }}
            whileTap={reducedMotion ? {} : { scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Sparkles className="w-5 h-5" />
            More Like This
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
