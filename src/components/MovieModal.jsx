import { useEffect } from "react";
import { X, Star, Calendar, Clock, User, PlayCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { TrailerPlayer } from "./TrailerPlayer";
import { Button } from "./ui/button";

/**
 * Modal component for expanded movie/TV show details - Cinema Red Redesign.
 */
export function MovieModal({ movie, onClose }) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const {
    title,
    kind,
    release_date,
    overview,
    genres,
    vibes,
    themes,
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
    id,
  } = movie;

  const safeGenres = genres || [];
  const safeVibes = vibes || [];
  const safeThemes = themes || [];

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

  const parsedCast = typeof cast === "string" ? JSON.parse(cast) : cast;
  const topCast = Array.isArray(parsedCast) ? parsedCast.slice(0, 5) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/90 backdrop-blur-sm transition-all duration-300 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative flex h-[92dvh] w-full flex-col overflow-hidden bg-card shadow-2xl sm:h-[85dvh] sm:max-w-5xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 hover:text-primary transition-all md:right-6 md:top-6"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Hero Section */}
          <div className="relative h-[40vh] w-full md:h-[50vh]">
            {backdropUrl ? (
              <>
                <img
                  src={backdropUrl}
                  alt={title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-card/80 via-transparent to-transparent sm:from-card/40" />
              </>
            ) : (
              <div className="h-full w-full bg-muted/20" />
            )}
          </div>

          {/* Content Body */}
          <div className="relative px-4 pb-12 md:px-10">
            <div className="flex flex-col md:flex-row md:gap-10">
              
              {/* Floating Poster - Mobile: Hidden/Small, Desktop: Overlapping */}
              <div className="-mt-20 md:-mt-32 lg:-mt-40 relative z-20 flex-shrink-0">
                {posterUrl && (
                  <div className="hidden md:block w-48 overflow-hidden rounded-xl border-4 border-card shadow-2xl lg:w-60">
                     <img src={posterUrl} alt={title} className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              {/* Main Info */}
              <div className="flex-1 space-y-6 pt-4 md:pt-0">
                
                {/* Header */}
                <div className="space-y-4">
                  {/* Title & Badges */}
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                      {title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 text-white font-medium">
                        <Calendar className="h-4 w-4 text-primary" /> {year}
                      </span>
                      {runtime_minutes && (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" /> {formatRuntime(runtime_minutes)}
                          </span>
                        </>
                      )}
                      {certification && (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <Badge variant="outline" className="border-white/20 text-xs">{certification}</Badge>
                        </>
                      )}
                      <Badge variant="secondary" className="bg-primary text-white hover:bg-primary/90 border-none">
                        {kind === "tv" ? "TV Series" : "Movie"}
                      </Badge>
                    </div>
                  </div>

                   {/* Match Score */}
                  <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">Match Score</span>
                        <span className="text-2xl font-bold text-green-400">{Math.round(combined_score * 100)}%</span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="flex-1">
                       <div className="text-xs text-muted-foreground mb-1">Strongest Signal</div>
                       <div className="flex items-center gap-2">
                           {strongest_signal === 'content' && <Badge variant="outline" className="border-blue-500/50 text-blue-400">Story</Badge>}
                           {strongest_signal === 'vibe' && <Badge variant="outline" className="border-purple-500/50 text-purple-400">Vibe</Badge>}
                           {strongest_signal === 'metadata' && <Badge variant="outline" className="border-orange-500/50 text-orange-400">Details</Badge>}
                       </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {id && (
                    <div className="flex flex-wrap gap-3">
                      {/* Trailer placeholder - functionality is inside TrailerPlayer but we can style a button trigger if needed, 
                          or just show the player directly. The design asked for details. 
                          I will embed the player nicely below. */}
                    </div>
                  )}
                </div>

                {/* Tab-like Layout for details */}
                <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
                    <div className="space-y-8">
                        {/* Overview */}
                        <section className="space-y-3">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                Overview
                            </h3>
                            <p className="text-base leading-relaxed text-muted-foreground">
                                {overview || "No overview available."}
                            </p>
                        </section>

                        {/* Trailer */}
                         {id && (
                            <section className="space-y-3">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <PlayCircle className="h-5 w-5 text-primary" /> Trailer
                                </h3>
                                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
                                    <TrailerPlayer
                                        tmdbId={id}
                                        mediaType={kind === "tv" ? "tv" : "movie"}
                                        title={title}
                                    />
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                         {/* Genres */}
                         {safeGenres.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Genres</h4>
                                <div className="flex flex-wrap gap-2">
                                    {safeGenres.map(g => (
                                        <Badge key={g} variant="outline" className="border-white/10 hover:bg-white/5 transition-colors">
                                            {g}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                         )}

                         {/* Vibes */}
                         {safeVibes.length > 0 && (
                             <div className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Vibes</h4>
                                <div className="flex flex-wrap gap-2">
                                    {safeVibes.map(v => (
                                        <span key={v} className="text-sm text-primary/90">#{v}</span>
                                    ))}
                                </div>
                            </div>
                         )}

                         {/* Cast */}
                         {topCast.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Cast</h4>
                                <ul className="space-y-2">
                                    {topCast.map((actor, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <User className="h-3 w-3" />
                                            {actor.name || actor}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                         )}
                         
                         {/* Director */}
                         {director && (
                             <div className="space-y-1">
                                 <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Director</h4>
                                 <p className="text-sm text-foreground">{director}</p>
                             </div>
                         )}
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
