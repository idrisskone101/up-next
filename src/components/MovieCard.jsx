import { Badge } from "./ui/badge";

/**
 * Individual movie/TV show card component tuned for the refreshed design.
 */
export function MovieCard({ movie, onClick }) {
  const {
    title,
    kind,
    release_date,
    overview,
    genres,
    vibes,
    vote_average,
    poster_path,
    combined_score,
    runtime_minutes,
  } = movie;

  // Handle null/undefined arrays safely
  const safeGenres = genres || [];
  const safeVibes = vibes || [];

  const posterUrl = poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : null;

  const year = release_date ? new Date(release_date).getFullYear() : "N/A";

  const truncatedOverview =
    overview?.length > 150
      ? `${overview.substring(0, 150)}…`
      : overview || "No description available.";

  const formatRuntime = (minutes) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/40 bg-card/85 p-[1px] text-left shadow-soft transition ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:-translate-y-1 hover:shadow-2xl active:translate-y-0.5"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-px rounded-[inherit] bg-gradient-to-br from-primary/15 via-transparent to-accent/25 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[inherit] bg-card/95">
        <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-primary/10 via-background/40 to-accent/10">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
              <svg
                className="h-16 w-16"
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

          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <div className="absolute left-4 top-4 flex flex-col gap-2">
            <Badge variant="outline" className="px-3 py-1 text-xs uppercase">
              {kind || "movie"}
            </Badge>
          </div>

          <div className="absolute right-4 top-4 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-semibold text-primary shadow-soft">
            {(combined_score * 100).toFixed(0)}% match
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 px-5 pb-6 pt-5 sm:px-6 sm:pb-7 sm:pt-6">
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-foreground sm:text-lg">
              {title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
              <span>{year}</span>
              {runtime_minutes && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span>{formatRuntime(runtime_minutes)}</span>
                </>
              )}
              {vote_average && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="inline-flex items-center gap-1">
                    <svg
                      className="h-3.5 w-3.5 text-amber-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927a1 1 0 011.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {vote_average.toFixed(1)}
                  </span>
                </>
              )}
            </div>
          </div>

          {safeGenres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {safeGenres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-border/40 bg-background/40 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {safeVibes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {safeVibes.slice(0, 3).map((vibe) => (
                <span
                  key={vibe}
                  className="rounded-full bg-gradient-to-r from-primary/15 to-accent/15 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {vibe}
                </span>
              ))}
            </div>
          )}

          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground/90">
            {truncatedOverview}
          </p>
        </div>
      </div>
    </button>
  );
}
