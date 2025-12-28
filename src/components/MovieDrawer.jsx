import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { MovieDetail } from "./MovieDetail";
import { haptics } from "../lib/haptics";
import {
  drawerVariants,
  drawerBackdropVariants,
  prefersReducedMotion,
} from "../lib/animations";

/**
 * Focus trap hook for accessibility
 */
function useFocusTrap(isOpen, containerRef) {
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Store previously focused element
    previousFocusRef.current = document.activeElement;

    // Get all focusable elements
    const getFocusableElements = () => {
      if (!containerRef.current) return [];
      return containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    };

    // Focus first element (close button)
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      setTimeout(() => focusableElements[0].focus(), 50);
    }

    // Handle tab key
    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Return focus to previously focused element
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, containerRef]);
}

/**
 * Right-side drawer for movie details on desktop
 * Slides in from right, keeps results visible but dimmed
 */
export function MovieDrawer({ movie, onClose, onMoreLikeThis }) {
  const [isOpen, setIsOpen] = useState(false);
  const cachedMovie = useRef(null);
  const drawerRef = useRef(null);

  // Update cached movie and open state when movie changes
  useEffect(() => {
    if (movie) {
      cachedMovie.current = movie;
      setIsOpen(true);
      document.body.style.overflow = "hidden";
    }
  }, [movie]);

  // Reset scroll on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    haptics.light();
    setIsOpen(false);
    document.body.style.overflow = "";
  }, []);

  // After exit animation, call parent onClose
  const handleExitComplete = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Focus trap
  useFocusTrap(isOpen, drawerRef);

  // Handle "More Like This" - close drawer and trigger callback
  const handleMoreLikeThis = useCallback((m) => {
    handleClose();
    setTimeout(() => {
      onMoreLikeThis?.(m);
    }, 300);
  }, [handleClose, onMoreLikeThis]);

  const displayMovie = cachedMovie.current;
  const reducedMotion = prefersReducedMotion();
  if (!displayMovie) return null;

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={reducedMotion ? {} : drawerBackdropVariants}
            initial={reducedMotion ? { opacity: 0 } : "hidden"}
            animate={reducedMotion ? { opacity: 1 } : "visible"}
            exit={reducedMotion ? { opacity: 0 } : "exit"}
            className="fixed inset-0 z-50 bg-[#0a0a0f]/60 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            ref={drawerRef}
            variants={reducedMotion ? {} : drawerVariants}
            initial={reducedMotion ? { x: "100%" } : "hidden"}
            animate={reducedMotion ? { x: 0 } : "visible"}
            exit={reducedMotion ? { x: "100%" } : "exit"}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            className="fixed top-0 right-0 bottom-0 w-[400px] md:w-[400px] lg:w-[440px] xl:w-[480px] flex flex-col bg-[rgba(18,18,24,0.98)] backdrop-blur-2xl border-l border-white/[0.08] shadow-[-20px_0_60px_rgba(0,0,0,0.5)]"
            style={{ zIndex: 60 }}
          >
            {/* Close Button */}
            <motion.button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close drawer"
              whileHover={reducedMotion ? {} : { scale: 1.1 }}
              whileTap={reducedMotion ? {} : { scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Screen reader title */}
            <h2 id="drawer-title" className="sr-only">
              {displayMovie.title} Details
            </h2>

            {/* Content */}
            <MovieDetail
              movie={displayMovie}
              onMoreLikeThis={handleMoreLikeThis}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
