import { useEffect } from "react";
import { ScoreBreakdown } from "./ScoreBreakdown";

/**
 * Modal component for expanded movie/TV show details
 */
export function MovieModal({ movie, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const {
    title,
    kind,
    release_date,
    overview,
    genres = [],
    vibes = [],
    themes = [],
    director,
    cast,
    vote_average,
    certification,
    runtime_minutes,
    poster_path,
    backdrop_path,
    content_score,
    vibe_score,
    metadata_score,
    combined_score,
    strongest_signal,
  } = movie;

  const posterUrl = poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : null;

  const backdropUrl = backdrop_path
    ? `https://image.tmdb.org/t/p/original${backdrop_path}`
    : null;

  const year = release_date ? new Date(release_date).getFullYear() : "N/A";

  const formatRuntime = (minutes) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Parse cast if it's a string
  const parsedCast = typeof cast === "string" ? JSON.parse(cast) : cast;
  const topCast = Array.isArray(parsedCast) ? parsedCast.slice(0, 5) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass rounded-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 glass rounded-full hover:bg-white/20 transition-colors"
          aria-label="Close modal"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Backdrop image */}
        {backdropUrl && (
          <div className="relative h-64 md:h-80 overflow-hidden rounded-t-2xl">
            <img
              src={backdropUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          </div>
        )}

        <div className="p-6 md:p-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left column - Poster and metadata */}
            <div className="md:col-span-1">
              {posterUrl && (
                <img
                  src={posterUrl}
                  alt={title}
                  className="w-full rounded-xl shadow-2xl mb-6"
                />
              )}

              {/* Metadata badges */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-white/60">Type:</span>
                  <span className="px-2 py-1 glass rounded text-white/90 uppercase font-semibold">
                    {kind || "movie"}
                  </span>
                </div>

                {certification && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">Rating:</span>
                    <span className="px-2 py-1 glass rounded text-white/90 font-semibold">
                      {certification}
                    </span>
                  </div>
                )}

                {runtime_minutes && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">Runtime:</span>
                    <span className="text-white/90">
                      {formatRuntime(runtime_minutes)}
                    </span>
                  </div>
                )}

                {vote_average && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">Rating:</span>
                    <div className="flex items-center gap-1 text-white/90">
                      <svg
                        className="w-4 h-4 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{vote_average.toFixed(1)}/10</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Score Breakdown */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white/80 mb-3">
                  Match Scores
                </h3>
                <ScoreBreakdown
                  contentScore={content_score}
                  vibeScore={vibe_score}
                  metadataScore={metadata_score}
                  combinedScore={combined_score}
                  strongestSignal={strongest_signal}
                />
              </div>
            </div>

            {/* Right column - Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Title and year */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {title}
                </h1>
                <p className="text-lg text-white/60">{year}</p>
              </div>

              {/* Overview */}
              {overview && (
                <div>
                  <h3 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">
                    Overview
                  </h3>
                  <p className="text-white/90 leading-relaxed">{overview}</p>
                </div>
              )}

              {/* Director */}
              {director && (
                <div>
                  <h3 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">
                    Director
                  </h3>
                  <p className="text-white/90">{director}</p>
                </div>
              )}

              {/* Cast */}
              {topCast.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">
                    Cast
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {topCast.map((actor, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 glass rounded-lg text-sm text-white/90"
                      >
                        {actor.name || actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Genres */}
              {genres.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">
                    Genres
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <span
                        key={genre}
                        className="px-3 py-1.5 bg-white/10 rounded-lg text-sm text-white/90"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Vibes */}
              {vibes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">
                    Vibes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {vibes.map((vibe) => (
                      <span
                        key={vibe}
                        className="px-3 py-1.5 bg-cyan-500/20 rounded-lg text-sm text-cyan-200"
                      >
                        {vibe}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Themes */}
              {themes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">
                    Themes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {themes.map((theme) => (
                      <span
                        key={theme}
                        className="px-3 py-1.5 bg-blue-500/20 rounded-lg text-sm text-blue-200"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
