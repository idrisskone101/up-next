import { Badge } from "./ui/badge";
import { Film, Tv } from "lucide-react";

/**
 * CircularProgress component for match score visualization
 */
function CircularProgress({ percentage, size = 44 }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border/60"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground sm:text-xs">
        {Math.round(percentage)}
      </div>
    </div>
  );
}

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
      className="group relative mx-auto flex h-full w-full max-w-[300px] flex-col overflow-hidden rounded-3xl border border-border/40 bg-card/85 p-[1px] text-left shadow-soft transition ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-none sm:hover:-translate-y-1 sm:hover:shadow-2xl active:translate-y-0.5"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-px rounded-[inherit] bg-gradient-to-br from-primary/15 via-transparent to-accent/25 opacity-0 transition-opacity duration-500 sm:group-hover:opacity-100"
      />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[inherit] bg-card/95">
        <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-primary/10 via-background/40 to-accent/10 sm:aspect-[2/3]">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 sm:group-hover:scale-105"
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

          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 transition-opacity duration-500 sm:group-hover:opacity-100" />

          {/* Media type icon badge */}
          <div className="absolute left-2 top-2 sm:left-4 sm:top-4">
            {kind === "tv" ? (
              <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/90 px-1.5 py-0.5 backdrop-blur-sm sm:gap-1.5 sm:px-2.5 sm:py-1">
                <Tv className="h-2.5 w-2.5 text-primary sm:h-3 sm:w-3" />
                <span className="text-[10px] font-medium uppercase tracking-wide text-foreground sm:text-xs">TV</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/90 px-1.5 py-0.5 backdrop-blur-sm sm:gap-1.5 sm:px-2.5 sm:py-1">
                <Film className="h-2.5 w-2.5 text-accent sm:h-3 sm:w-3" />
                <span className="text-[10px] font-medium uppercase tracking-wide text-foreground sm:text-xs">Movie</span>
              </div>
            )}
          </div>

          {/* Circular match score */}
          <div className="absolute right-2 top-2 flex flex-col items-center gap-0.5 rounded-xl border border-border/60 bg-background/95 p-1.5 backdrop-blur-sm shadow-lg sm:right-4 sm:top-4 sm:gap-1 sm:p-2">
            <CircularProgress percentage={combined_score * 100} size={36} className="" />
            <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground sm:text-[10px]">Match</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 px-3 pb-3 pt-2.5 sm:gap-3 sm:px-5 sm:pb-6 sm:pt-5 md:px-6 md:pb-7 md:pt-6">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 sm:text-base md:text-lg">
              {title}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground sm:gap-2 sm:text-xs md:text-sm">
              <span>{year}</span>
              {runtime_minutes && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="hidden sm:inline">{formatRuntime(runtime_minutes)}</span>
                </>
              )}
              {vote_average && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="inline-flex items-center gap-0.5 sm:gap-1">
                    <svg
                      className="h-2.5 w-2.5 text-amber-400 sm:h-3.5 sm:w-3.5"
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

          {/* Combined genre and vibe tags */}
          {(safeGenres.length > 0 || safeVibes.length > 0) && (
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {safeGenres.slice(0, 1).map((genre) => (
                <span
                  key={genre}
                  className="inline-flex items-center rounded-md border border-border/50 bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground transition-colors sm:group-hover:border-border/70 sm:px-2 sm:text-xs"
                >
                  {genre}
                </span>
              ))}
              {safeGenres.slice(1, 2).map((genre) => (
                <span
                  key={genre}
                  className="hidden sm:inline-flex items-center rounded-md border border-border/50 bg-secondary/60 px-2 py-0.5 text-xs font-medium text-secondary-foreground transition-colors sm:group-hover:border-border/70"
                >
                  {genre}
                </span>
              ))}
              {safeVibes.slice(0, 1).map((vibe) => (
                <span
                  key={vibe}
                  className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary ring-1 ring-inset ring-primary/20 transition-all sm:group-hover:bg-primary/15 sm:px-2 sm:text-xs"
                >
                  {vibe}
                </span>
              ))}
              {safeVibes.slice(1, 2).map((vibe) => (
                <span
                  key={vibe}
                  className="hidden sm:inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20 transition-all sm:group-hover:bg-primary/15"
                >
                  {vibe}
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/90 sm:line-clamp-3 sm:text-sm">
              {overview || "No description available."}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card/95 to-transparent pointer-events-none sm:h-6" />
          </div>
        </div>
      </div>
    </button>
  );
}
