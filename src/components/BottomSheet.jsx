import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { haptics } from "../lib/haptics";
import { X } from "lucide-react";

// Refined spring configs - smoother, more natural feel
const enterSpring = {
  type: "spring",
  stiffness: 380,
  damping: 35,
  mass: 0.8,
};

const exitSpring = {
  type: "spring",
  stiffness: 320,
  damping: 28,
  mass: 0.9,
};

const snapBackSpring = {
  type: "spring",
  stiffness: 400,
  damping: 32,
  mass: 0.7,
};

// Drag thresholds
const DISMISS_THRESHOLD = 120;
const VELOCITY_THRESHOLD = 500;

/**
 * iOS-style bottom sheet with swipe-to-dismiss
 * Floating header with drag handle and close button overlays content
 */
export function BottomSheet({ isOpen, onClose, children }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dragY = useMotionValue(0);
  const sheetRef = useRef(null);
  const contentRef = useRef(null);

  // Transform drag to opacity for backdrop
  const backdropOpacity = useTransform(dragY, [0, 200], [1, 0.3]);

  // Reset dragY when opening
  useEffect(() => {
    if (isOpen) {
      dragY.set(0);
      setIsClosing(false);
    }
  }, [isOpen, dragY]);

  // Animated close function - sets isClosing to trigger exit animation
  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    haptics.light();
  }, [isClosing]);

  // When closing animation completes, call onClose
  const handleAnimationComplete = useCallback((definition) => {
    if (definition === "closed" && isClosing) {
      onClose();
    }
  }, [isClosing, onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle drag end with velocity-aware animation
  const handleDragEnd = useCallback((_, info) => {
    setIsDragging(false);
    const { velocity, offset } = info;

    const shouldDismiss =
      offset.y > DISMISS_THRESHOLD ||
      velocity.y > VELOCITY_THRESHOLD;

    if (shouldDismiss) {
      haptics.success();
      setIsClosing(true);
      // Reset dragY so variant animation takes over cleanly
      dragY.set(0);
    } else {
      // Smooth snap back with refined spring
      animate(dragY, 0, snapBackSpring);
    }
  }, [dragY]);

  // Handle drag start - only allow if content is scrolled to top
  const handleDragStart = useCallback(() => {
    if (contentRef.current && contentRef.current.scrollTop > 0) {
      return false;
    }
    setIsDragging(true);
    haptics.light();
  }, []);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: isClosing ? 0 : 1 }}
            exit={{ opacity: 0 }}
            style={{ opacity: isClosing ? undefined : backdropOpacity }}
            transition={{ duration: 0.25 }}
            onClick={handleBackdropClick}
          />

          {/* Sheet Container */}
          <motion.div
            ref={sheetRef}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col touch-none"
            style={{ height: "95dvh", y: isClosing ? undefined : dragY }}
            initial="hidden"
            animate={isClosing ? "closed" : "visible"}
            exit="closed"
            variants={{
              hidden: { y: "100%" },
              visible: { y: 0 },
              closed: { y: "100%" },
            }}
            transition={isClosing ? exitSpring : enterSpring}
            onAnimationComplete={handleAnimationComplete}
            drag={isClosing ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Sheet */}
            <div className="relative flex h-full flex-col overflow-hidden rounded-t-3xl bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 border-t border-x border-white/10">

              {/* Floating Header - Overlays content */}
              <div className="absolute top-0 left-0 right-0 z-20 pt-safe-top">
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div
                    className={`w-9 h-1 rounded-full transition-colors ${
                      isDragging ? 'bg-white/60' : 'bg-white/30'
                    }`}
                  />
                </div>

                {/* Close Button - Positioned top right */}
                <div className="absolute top-3 right-3 pt-safe-top">
                  <motion.button
                    onClick={handleClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:bg-black/70 hover:text-white transition-colors"
                    whileTap={{ scale: 0.9 }}
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              {/* Scrollable Content - Full height, content handles its own padding */}
              <div
                ref={contentRef}
                className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
              >
                {children}
              </div>

              {/* Safe area padding at bottom */}
              <div className="flex-shrink-0 pb-safe-bottom" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
