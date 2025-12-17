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
        console.warn("[TrailerPlayer] No TMDB ID provided");
        setLoading(false);
        return;
      }

      // Check cache first
      const cached = getTrailer(tmdbId);
      if (cached) {
        console.log("[TrailerPlayer] Using cached trailer:", cached.name);
        setTrailer(cached);
        setLoading(false);
        return;
      }

      try {
        console.log(
          `[TrailerPlayer] Loading trailer for TMDB ID: ${tmdbId}, type: ${mediaType}`,
        );
        setLoading(true);
        setError(null);

        const trailerData = await fetchTrailer(tmdbId, mediaType);

        if (mounted) {
          if (trailerData) {
            console.log(
              "[TrailerPlayer] Trailer loaded successfully:",
              trailerData.name,
            );
            setTrailer(trailerData);
          } else {
            console.warn("[TrailerPlayer] No trailer available for this title");
            setError("No trailer available");
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("[TrailerPlayer] Error loading trailer:", err);
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
      <div className="w-full aspect-video bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg flex items-center justify-center border border-white/10">
        <div className="flex flex-col items-center gap-2 px-4 text-center">
          <svg
            className="w-12 h-12 text-white/20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-white/60">
            {error || "No trailer available"}
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
