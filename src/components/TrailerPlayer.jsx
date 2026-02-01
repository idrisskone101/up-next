import { useState, useEffect } from "react";
import { fetchTrailer } from "../lib/api";
import { getTrailer } from "../lib/trailerCache";

/**
 * YouTube trailer player component with auto-loading
 */
export function TrailerPlayer({ tmdbId, mediaType = "movie", title }) {
  const [trailer, setTrailer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadTrailer() {
      if (!tmdbId) {
        if (import.meta.env.DEV) {
          console.warn("[TrailerPlayer] No TMDB ID provided");
        }
        setLoading(false);
        return;
      }

      // Check cache first
      const cached = getTrailer(tmdbId);
      if (cached) {
        if (import.meta.env.DEV) {
          console.log("[TrailerPlayer] Using cached trailer:", cached.name);
        }
        setTrailer(cached);
        setLoading(false);
        return;
      }

      try {
        if (import.meta.env.DEV) {
          console.log(
            `[TrailerPlayer] Loading trailer for TMDB ID: ${tmdbId}, type: ${mediaType}`,
          );
        }
        setLoading(true);
        setError(null);

        const trailerData = await fetchTrailer(tmdbId, mediaType);

        if (mounted) {
          if (trailerData) {
            if (import.meta.env.DEV) {
              console.log(
                "[TrailerPlayer] Trailer loaded successfully:",
                trailerData.name,
              );
            }
            setTrailer(trailerData);
          } else {
            if (import.meta.env.DEV) {
              console.warn("[TrailerPlayer] No trailer available for this title");
            }
            setError("No trailer available");
          }
          setLoading(false);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("[TrailerPlayer] Error loading trailer:", err);
        }
        if (mounted) {
          setError("Failed to load trailer");
          setLoading(false);
        }
      }
    }

    loadTrailer();

    return () => {
      mounted = false;
    };
  }, [tmdbId, mediaType]);

  if (loading) {
    return (
      <div className="w-full aspect-video bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-sm text-white/60">Loading trailer...</p>
        </div>
      </div>
    );
  }

  if (error || !trailer) {
    return (
      <div className="w-full aspect-video bg-gradient-to-br from-[#1a1714] via-[#0d0b09] to-[#1a1714] rounded-lg flex items-center justify-center border border-brand-golden/20 relative overflow-hidden">
        {/* Subtle decorative corners */}
        <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-brand-golden/20 rounded-tl-lg" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-brand-golden/20 rounded-br-lg" />

        <div className="flex flex-col items-center gap-3 px-6 text-center">
          {/* Playful emoji with subtle animation */}
          <span className="text-4xl animate-pulse">🎬</span>
          <p className="text-base font-medium text-white/70">
            No trailer yet
          </p>
          <p className="text-xs text-white/40 max-w-[200px]">
            Check streaming services for this one!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
        <iframe
          src={trailer.embedUrl}
          title={trailer.name || `${title} Trailer`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {trailer.name && (
        <p className="mt-2 text-sm text-white/60 text-center">{trailer.name}</p>
      )}
    </div>
  );
}
