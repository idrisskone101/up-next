import { useState, useEffect } from "react";

/**
 * Get initial match value synchronously to prevent flash
 */
function getInitialMatch(query) {
  if (typeof window === "undefined") return false;
  return window.matchMedia(query).matches;
}

/**
 * SSR-safe media query hook
 * Returns true if the media query matches
 * Initializes with actual value to prevent layout flash
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => getInitialMatch(query));

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e) => setMatches(e.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

/**
 * Convenience hook for mobile breakpoint
 * Returns true when viewport is mobile (≤768px)
 */
export function useIsMobile() {
  return useMediaQuery("(max-width: 768px)");
}
