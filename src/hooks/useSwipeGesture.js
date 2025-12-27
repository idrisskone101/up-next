import { useCallback, useRef, useEffect } from "react";

/**
 * Custom hook for swipe gesture detection
 * Supports edge detection for drawer opening patterns
 *
 * @param {React.RefObject} ref - Element ref to attach listeners
 * @param {Object} options - Configuration options
 * @param {Function} options.onSwipeLeft - Callback for left swipe
 * @param {Function} options.onSwipeRight - Callback for right swipe
 * @param {boolean} options.edgeOnly - Only trigger if swipe starts near edge
 * @param {number} options.edgeThreshold - Pixels from edge to detect (default 20)
 * @param {number} options.minSwipeDistance - Min px to trigger swipe (default 50)
 * @param {boolean} options.enabled - Whether gestures are enabled (default true)
 */
export function useSwipeGesture(ref, options = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    edgeOnly = false,
    edgeThreshold = 20,
    minSwipeDistance = 50,
    enabled = true,
  } = options;

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const startedFromEdge = useRef(false);

  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;

    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchEndX.current = touch.clientX;
    touchEndY.current = touch.clientY;

    // Check if touch started near left edge
    startedFromEdge.current = touch.clientX <= edgeThreshold;
  }, [enabled, edgeThreshold]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled) return;

    const touch = e.touches[0];
    touchEndX.current = touch.clientX;
    touchEndY.current = touch.clientY;
  }, [enabled]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled) return;

    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Must be primarily horizontal (not vertical scroll)
    if (absX < minSwipeDistance || absY > absX * 0.7) {
      return;
    }

    // Check edge requirement for right swipe (opening drawer)
    if (edgeOnly && deltaX > 0 && !startedFromEdge.current) {
      return;
    }

    if (deltaX > 0 && onSwipeRight) {
      onSwipeRight();
    } else if (deltaX < 0 && onSwipeLeft) {
      onSwipeLeft();
    }
  }, [enabled, minSwipeDistance, edgeOnly, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    const element = ref?.current;
    if (!element || !enabled) return;

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [ref, enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { touchStartX, touchEndX };
}

/**
 * Hook for global edge swipe detection (attach to document/window)
 * Useful for triggering drawer open from anywhere in app
 */
export function useEdgeSwipe(options = {}) {
  const {
    onSwipeFromLeftEdge,
    edgeThreshold = 20,
    minSwipeDistance = 50,
    enabled = true,
  } = options;

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const startedFromEdge = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      touchEndX.current = touch.clientX;
      touchEndY.current = touch.clientY;
      startedFromEdge.current = touch.clientX <= edgeThreshold;
    };

    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      touchEndX.current = touch.clientX;
      touchEndY.current = touch.clientY;
    };

    const handleTouchEnd = () => {
      if (!startedFromEdge.current) return;

      const deltaX = touchEndX.current - touchStartX.current;
      const deltaY = touchEndY.current - touchStartY.current;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Must be horizontal swipe from edge
      if (deltaX > minSwipeDistance && absY < absX * 0.7) {
        onSwipeFromLeftEdge?.();
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, edgeThreshold, minSwipeDistance, onSwipeFromLeftEdge]);
}
