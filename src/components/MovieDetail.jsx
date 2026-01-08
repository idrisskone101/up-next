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
      className="flex flex-col h-full bg-transparent"
    >
      {/* Hero Image Zone - Enhanced with warm glow */}
      <motion.div
        variants={drawerContentItemVariants}
        className="relative h-56 lg:h-64 shrink-0 overflow-hidden"
      >
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
        )}
        {/* Warm gradient overlay - golden tint at top, dark at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b09] via-[#1a1714]/70 to-brand-golden/10" />
        {/* Decorative golden corner accents */}
        <div className="absolute top-3 left-3 w-10 h-10 border-l-2 border-t-2 border-brand-golden/30 rounded-tl-lg pointer-events-none" />
        <div className="absolute top-3 right-3 w-10 h-10 border-r-2 border-t-2 border-brand-golden/30 rounded-tr-lg pointer-events-none" />

        {/* Title overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3 drop-shadow-2xl tracking-tight font-heading">
            {title}
          </h1>

          {/* Metadata row - high contrast */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-white/90 font-medium">
              <Calendar className="h-4 w-4 text-brand-red" /> {year}
            </span>
            {runtime_minutes && (
              <>
                <span className="text-white/30">•</span>
                <span className="flex items-center gap-1.5 text-white/90 font-medium">
                  <Clock className="h-4 w-4 text-brand-red" /> {formatRuntime(runtime_minutes)}
                </span>
              </>
            )}
            {vote_average && (
              <>
                <span className="text-white/30">•</span>
                <span className="flex items-center gap-1.5 text-brand-golden font-bold">
                  <Star className="h-4 w-4 fill-brand-golden" /> {vote_average.toFixed(1)}
                </span>
              </>
            )}
            {certification && (
              <Badge variant="outline" className="border-white/30 text-white text-xs py-0.5 px-2 h-6 bg-white/10 font-semibold">
                {certification}
              </Badge>
            )}
            <Badge className="bg-brand-red text-white text-xs py-0.5 px-3 h-6 font-bold uppercase tracking-wide">
              {kind === "tv" ? "TV" : "Film"}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Overview */}
        <motion.section variants={drawerContentItemVariants}>
          <h3 className="text-xs font-bold text-brand-golden mb-3 uppercase tracking-widest">
            Synopsis
          </h3>
          <p className="text-sm leading-relaxed text-white/85">
            {overview || "No overview available."}
          </p>
        </motion.section>

        {/* Genres - Colorful tags */}
        {safeGenres.length > 0 && (
          <motion.section variants={drawerContentItemVariants}>
            <h3 className="text-xs font-bold text-brand-golden mb-3 flex items-center gap-2 uppercase tracking-widest">
              <Tag className="h-3.5 w-3.5" /> Genres
            </h3>
            <div className="flex flex-wrap gap-2">
              {safeGenres.map((g, i) => {
                // Colorful gradients for each genre
                const colors = [
                  "from-purple-500 to-pink-500",
                  "from-brand-golden to-brand-orange",
                  "from-cyan-500 to-blue-500",
                  "from-emerald-500 to-teal-400",
                  "from-rose-500 to-red-400",
                  "from-indigo-500 to-violet-500",
                  "from-amber-400 to-yellow-300",
                ];
                const colorClass = colors[i % colors.length];
                return (
                  <motion.div
                    key={g}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Badge
                      className={`bg-gradient-to-r ${colorClass} text-white text-xs font-semibold px-3 py-1.5 border-0 shadow-lg cursor-pointer`}
                    >
                      {g}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Trailer - Enhanced with golden accent */}
        {id && (
          <motion.section variants={drawerContentItemVariants}>
            <h3 className="text-xs font-bold text-brand-golden mb-3 flex items-center gap-2 uppercase tracking-widest">
              <PlayCircle className="h-3.5 w-3.5" /> Trailer
            </h3>
            <div className="overflow-hidden rounded-xl border-2 border-brand-golden/30 bg-black shadow-[0_0_20px_rgba(238,199,69,0.1)]">
              <TrailerPlayer
                tmdbId={id}
                mediaType={kind === "tv" ? "tv" : "movie"}
                title={title}
              />
            </div>
          </motion.section>
        )}

        {/* Two Column Layout for Cast & Director */}
        <motion.div variants={drawerContentItemVariants} className="grid grid-cols-2 gap-6">
          {/* Cast */}
          {topCast.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-brand-golden mb-3 uppercase tracking-widest">
                Cast
              </h3>
              <ul className="space-y-2">
                {topCast.map((actor, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/85">
                    <User className="h-4 w-4 text-brand-golden/60 shrink-0" />
                    <span className="truncate">{actor.name || actor}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Director */}
          {director && (
            <section>
              <h3 className="text-xs font-bold text-brand-golden mb-3 uppercase tracking-widest">
                Director
              </h3>
              <p className="text-sm text-white/85">{director}</p>
            </section>
          )}
        </motion.div>

        {/* More Like This Button - Enhanced with warm gradient */}
        {onMoreLikeThis && (
          <motion.div variants={reducedMotion ? {} : drawerContentItemVariants} className="pt-4 pb-6">
            <motion.button
              onClick={() => {
                haptics.light();
                onMoreLikeThis(movie);
              }}
              className="group relative w-full h-14 flex items-center justify-center gap-3 rounded-full overflow-hidden bg-gradient-to-r from-brand-golden via-brand-orange to-brand-red text-white font-bold text-base uppercase tracking-wide shadow-lg shadow-brand-orange/30 transition-all duration-200 hover:shadow-[0_0_40px_rgba(238,199,69,0.4)]"
              whileHover={reducedMotion ? {} : { scale: 1.03, y: -3 }}
              whileTap={reducedMotion ? {} : { scale: 0.97 }}
              transition={reducedMotion ? { duration: 0 } : springConfigs.snappy}
            >
              {/* Shimmer effect on hover */}
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Sparkles className="w-5 h-5 relative" />
              <span className="relative">More Like This</span>
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
