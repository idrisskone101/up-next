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
          {/* Backdrop - Warm tinted dark */}
          <motion.div
            variants={reducedMotion ? {} : drawerBackdropVariants}
            initial={reducedMotion ? { opacity: 0 } : "hidden"}
            animate={reducedMotion ? { opacity: 1 } : "visible"}
            exit={reducedMotion ? { opacity: 0 } : "exit"}
            className="fixed inset-0 z-50 bg-gradient-to-r from-black/85 to-brand-red/20 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Drawer Panel - Warm dark with golden accents */}
          <motion.div
            ref={drawerRef}
            variants={reducedMotion ? {} : drawerVariants}
            initial={reducedMotion ? { x: "100%" } : "hidden"}
            animate={reducedMotion ? { x: 0 } : "visible"}
            exit={reducedMotion ? { x: "100%" } : "exit"}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            className="fixed top-0 right-0 bottom-0 w-[400px] md:w-[400px] lg:w-[440px] xl:w-[480px] flex flex-col bg-gradient-to-b from-[#1a1714] to-[#0d0b09] shadow-[-24px_0_80px_rgba(0,0,0,0.7)]"
            style={{ zIndex: 60 }}
          >
            {/* Golden accent border on left edge */}
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-brand-golden/60 via-brand-orange/40 to-brand-red/30" />

            {/* Close Button - Golden glow on hover */}
            <motion.button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:text-brand-golden hover:bg-brand-golden/20 hover:border-brand-golden/50 hover:shadow-[0_0_20px_rgba(238,199,69,0.3)] transition-all duration-200"
              aria-label="Close drawer"
              whileHover={reducedMotion ? {} : { scale: 1.1, rotate: 90 }}
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
