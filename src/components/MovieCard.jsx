/**
 * Individual movie/TV show card component - optimized for mobile touch
 */
export function MovieCard({ movie, onClick }) {
  const {
    title,
    kind,
    release_date,
    overview,
    genres = [],
    vibes = [],
    vote_average,
    poster_path,
    combined_score,
    runtime_minutes,
  } = movie;

  // Format poster URL
  const posterUrl = poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : null;

  // Format release year
  const year = release_date ? new Date(release_date).getFullYear() : "N/A";

  // Truncate overview
  const truncatedOverview =
    overview?.length > 150
      ? `${overview.substring(0, 150)}...`
      : overview || "No description available.";

  // Format runtime
  const formatRuntime = (minutes) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div
      onClick={onClick}
      className="glass md:glass-hover rounded-xl overflow-hidden cursor-pointer
                 md:transform md:transition-all md:duration-200 md:hover:scale-105 md:hover:shadow-2xl
                 group animate-fade-in active:scale-95 transition-transform"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] bg-gradient-to-br from-cyan-900/20 to-blue-900/20 overflow-hidden">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover md:group-hover:scale-110 md:transition-transform md:duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-20 h-20 text-white/20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
              />
            </svg>
          </div>
        )}

        {/* Score badge */}
        <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg">
          <span className="text-sm font-bold text-cyan-300 font-mono">
            {(combined_score * 100).toFixed(0)}%
          </span>
        </div>

        {/* Kind badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-md">
          <span className="text-xs font-semibold text-white/90 uppercase">
            {kind || "movie"}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Title and Year */}
        <div>
          <h3 className="text-base md:text-lg font-bold text-white line-clamp-2 leading-tight">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs md:text-sm text-white/60">
            <span>{year}</span>
            {runtime_minutes && (
              <>
                <span>•</span>
                <span>{formatRuntime(runtime_minutes)}</span>
              </>
            )}
            {vote_average && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{vote_average.toFixed(1)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Genres */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="px-2 py-0.5 text-xs bg-white/10 text-white/80 rounded-md"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Vibes */}
        {vibes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {vibes.slice(0, 3).map((vibe) => (
              <span
                key={vibe}
                className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-200 rounded-md"
              >
                {vibe}
              </span>
            ))}
          </div>
        )}

        {/* Overview */}
        <p className="text-xs md:text-sm text-white/70 line-clamp-3 leading-relaxed">
          {truncatedOverview}
        </p>

        {/* View Details hint */}
        <div className="pt-2 text-xs text-cyan-300 md:group-hover:text-cyan-200 md:transition-colors">
          Tap to view details →
        </div>
      </div>
    </div>
  );
}
