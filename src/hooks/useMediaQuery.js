import { useState, useEffect } from "react";

/**
 * SSR-safe media query hook
 * Returns true if the media query matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Listen for changes
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
