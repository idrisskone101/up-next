import { Badge } from "./ui/badge";
import { Film, Tv, Star, Clock, Calendar } from "lucide-react";

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
    vote_average,
    poster_path,
    combined_score,
    runtime_minutes,
  } = movie;

  // Handle null/undefined arrays safely
  const safeGenres = genres || [];

  const posterUrl = poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : null;

  const year = release_date ? new Date(release_date).getFullYear() : "N/A";

  const formatRuntime = (minutes) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const matchPercentage = Math.round((combined_score || 0) * 100);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full flex-col gap-2 text-left transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* Poster Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted/30 shadow-lg transition-shadow duration-300 group-hover:shadow-2xl group-hover:shadow-orange-500/10 border border-white/5 group-hover:border-orange-500/30">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40 bg-muted/20">
            <Film className="h-8 w-8 sm:h-12 sm:w-12" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Match Badge - Responsive */}
        {matchPercentage > 0 && (
          <div className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2">
             <Badge variant="secondary" className="bg-black/60 backdrop-blur-md border-white/10 text-orange-400 font-bold shadow-xl text-[10px] px-1.5 py-0.5 sm:text-xs sm:px-2.5 sm:py-1">
               {matchPercentage}%
             </Badge>
          </div>
        )}

        {/* Kind Badge - Hidden on tiny screens, visible on larger */}
        <div className="absolute left-1.5 top-1.5 sm:left-2 sm:top-2 hidden xs:block">
          <Badge variant="outline" className="bg-black/40 backdrop-blur-md border-white/10 text-white/90 uppercase tracking-wider text-[8px] px-1.5 py-0.5 sm:text-[10px] sm:px-2.5 sm:py-1">
            {kind === 'tv' ? 'TV' : 'Movie'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1 px-0.5">
        <h3 className="text-sm font-bold leading-tight text-foreground group-hover:text-orange-400 transition-colors line-clamp-1 sm:text-base">
          {title}
        </h3>
        
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground sm:text-xs">
          <span className="flex items-center gap-1 group-hover:text-white/80 transition-colors">
            {year}
          </span>
          
          {vote_average && (
            <span className="flex items-center gap-1 text-amber-400/90">
              <Star className="h-2.5 w-2.5 fill-current sm:h-3 sm:w-3" />
              {vote_average.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
