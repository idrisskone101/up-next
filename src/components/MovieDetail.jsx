import { motion } from "framer-motion";
import { Sparkles, Tv, Film } from "lucide-react";
import { TrailerPlayer } from "./TrailerPlayer";
import { ProviderBadges } from "./ProviderBadges";
import { haptics } from "../lib/haptics";
import {
  drawerContentContainerVariants,
  drawerContentItemVariants,
  synopsisCardVariants,
  castListContainerVariants,
  castListItemVariants,
  ctaFloatAnimation,
  prefersReducedMotion,
} from "../lib/animations";

const formatRuntime = (minutes) => {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const capitalize = (str) => {
  if (typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Golden dot separator for inline metadata
 */
const Dot = () => <span className="text-brand-golden">·</span>;

/**
 * MovieDetail - Cinematic Card Stack design
 * Magazine editorial meets film poster aesthetic
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
    runtime_minutes,
    poster_path,
    backdrop_path,
    providers,
  } = movie;

  const streamingProviders = providers?.flatrate || [];
  const safeGenres = genres || [];
  const year = release_date ? new Date(release_date).getFullYear() : null;

  const backdropUrl = backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${backdrop_path}`
    : poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : null;

  const parsedCast = typeof cast === "string" ? JSON.parse(cast) : cast;
  const topCast = Array.isArray(parsedCast) ? parsedCast.slice(0, 5) : [];

  const reducedMotion = prefersReducedMotion();

  // Build metadata pieces for inline display (capitalize genres)
  const metaPieces = [];
  if (safeGenres.length > 0) {
    metaPieces.push(...safeGenres.slice(0, 3).map(capitalize));
  }
  if (year) metaPieces.push(year);
  if (runtime_minutes) metaPieces.push(formatRuntime(runtime_minutes));

  return (
    <motion.div
      variants={reducedMotion ? {} : drawerContentContainerVariants}
      initial={reducedMotion ? { opacity: 1 } : "hidden"}
      animate={reducedMotion ? { opacity: 1 } : "visible"}
      className="flex flex-col h-full bg-black"
    >
      {/* Hero Zone - Compact height */}
      <motion.div
        variants={drawerContentItemVariants}
        className="relative h-48 lg:h-56 shrink-0 overflow-hidden"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />

        {/* Title + metadata overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
          {/* Type badge - matches MovieCard colors */}
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide mb-2 ${
              kind === "tv"
                ? "bg-brand-orange/90 text-white"
                : "bg-brand-golden text-amber-900"
            }`}
          >
            {kind === "tv" ? (
              <Tv className="w-3 h-3" />
            ) : (
              <Film className="w-3 h-3" />
            )}
            <span>{kind === "tv" ? "TV" : "Movie"}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 drop-shadow-2xl tracking-tight font-heading line-clamp-2">
            {title}
          </h1>

          {/* Inline metadata: Genre · Genre · Year · Runtime */}
          {metaPieces.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/80">
              {metaPieces.map((piece, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span>{piece}</span>
                  {i < metaPieces.length - 1 && <Dot />}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Scrollable Content - Card Stack */}
      <div className="flex-1 overflow-y-auto">
        {/* Synopsis Card - Overlaps hero */}
        {overview && (
          <motion.div
            variants={synopsisCardVariants}
            className="relative mt-4 mx-4 p-5 bg-gradient-to-br from-neutral-900/95 to-neutral-950/95 rounded-2xl border border-white/10 shadow-xl"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
              Synopsis
            </h3>
            <p className="text-sm leading-relaxed text-white/90">
              {overview}
            </p>
          </motion.div>
        )}

        {/* Content sections with generous spacing */}
        <div className="px-6 py-6 space-y-6">
          {/* Where to Watch */}
          {streamingProviders.length > 0 && (
            <motion.section variants={drawerContentItemVariants}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
                Where to Watch
              </h3>
              <ProviderBadges providers={streamingProviders} />
            </motion.section>
          )}

          {/* Trailer */}
          {id && (
            <motion.section variants={drawerContentItemVariants}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
                Trailer
              </h3>
              <div className="-mx-6 overflow-hidden rounded-none">
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
            <motion.section variants={drawerContentItemVariants}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
                Cast
              </h3>
              <motion.div
                variants={castListContainerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
                {topCast.map((actor, i) => {
                  const name = actor.name || actor;
                  const character = actor.character;
                  return (
                    <motion.div
                      key={i}
                      variants={castListItemVariants}
                      className="text-sm group"
                    >
                      <span className="text-white/90 font-medium group-hover:text-brand-golden transition-colors">
                        {name}
                      </span>
                      {character && (
                        <span className="text-white/50 ml-1.5">as {character}</span>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.section>
          )}

          {/* Director - Integrated credit line */}
          {director && (
            <motion.p
              variants={drawerContentItemVariants}
              className="text-sm text-white/60"
            >
              Directed by{" "}
              <span className="text-brand-golden font-medium">{director}</span>
            </motion.p>
          )}
        </div>
      </div>

      {/* Sticky CTA - More Like This */}
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
            animate={reducedMotion ? {} : ctaFloatAnimation}
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
