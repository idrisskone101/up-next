import { useState } from "react";
import { motion } from "framer-motion";
import { Film, Star } from "lucide-react";
import { springConfigs } from "../../lib/animations";
import { haptics } from "../../lib/haptics";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342";

/**
 * Compact movie/TV card for discovery rows
 * Fixed 180px width with 2:3 poster aspect ratio
 */
export function DiscoveryCard({
  title,
  poster_path,
  release_year,
  tmdb_rating,
  kind,
  onClick
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const posterUrl = poster_path ? `${TMDB_IMAGE_BASE}${poster_path}` : null;
  const displayRating = tmdb_rating ? tmdb_rating.toFixed(1) : null;

  const handleClick = () => {
    haptics.light();
    onClick?.();
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={springConfigs.snappy}
      className="w-[180px] flex-shrink-0 scroll-snap-align-start text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] group"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-white/[0.04] border border-white/[0.08] group-hover:border-white/15 transition-colors duration-200">
        {posterUrl && !imageError ? (
          <>
            <motion.img
              src={posterUrl}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: imageLoaded ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
            {/* Shimmer placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] via-white/[0.05] to-white/[0.02] animate-shimmer" />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/20">
            <Film className="h-10 w-10" />
          </div>
        )}

        {/* Hover gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />

        {/* Kind badge (TV only) */}
        {kind === "tv" && (
          <div className="absolute left-2 top-2 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm border border-white/10 text-[9px] font-medium text-white/80 uppercase tracking-wider">
            TV
          </div>
        )}

        {/* Shadow lift on hover */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          whileHover={{ boxShadow: "0 12px 32px rgba(0,0,0,0.4)" }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {/* Title & Meta */}
      <div className="mt-2 px-0.5">
        <h3 className="text-sm font-medium text-white/90 line-clamp-2 leading-snug group-hover:text-white transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-white/50">
          {release_year && <span>{release_year}</span>}
          {release_year && displayRating && <span>·</span>}
          {displayRating && (
            <span className="flex items-center gap-0.5 text-amber-400/80">
              <Star className="h-2.5 w-2.5 fill-current" />
              {displayRating}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
