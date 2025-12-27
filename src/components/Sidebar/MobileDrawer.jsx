import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeGesture } from "../../hooks/useSwipeGesture";
import { springConfigs } from "../../lib/animations";

// Animation variants for drawer
const drawerVariants = {
  closed: {
    x: "-100%",
    transition: { type: "spring", stiffness: 400, damping: 35 },
  },
  open: {
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

// Animation variants for backdrop
const backdropVariants = {
  closed: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
  open: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
};

/**
 * Mobile slide-in drawer for sidebar navigation
 * Features:
 * - Slides from left edge
 * - Dimmed backdrop tap to close
 * - Swipe left to close
 * - Drag handle visual
 * - Respects safe areas
 */
export function MobileDrawer({ isOpen, onClose, children }) {
  const drawerRef = useRef(null);

  // Swipe left anywhere on drawer to close
  useSwipeGesture(drawerRef, {
    onSwipeLeft: onClose,
    enabled: isOpen,
    minSwipeDistance: 40,
  });

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
      }
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            variants={backdropVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={onClose}
            className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.aside
            ref={drawerRef}
            key="drawer-panel"
            variants={drawerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed top-0 left-0 bottom-0 z-[100] flex w-[85vw] max-w-[320px] flex-col overflow-hidden border-r border-white/[0.06]"
            style={{
              backgroundColor: "var(--surface-elevated)",
              paddingTop: "env(safe-area-inset-top)",
              paddingLeft: "env(safe-area-inset-left)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <motion.div
                initial={{ opacity: 0, scaleX: 0.5 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.1, ...springConfigs.snappy }}
                className="h-1 w-10 rounded-full bg-white/30"
              />
            </div>

            {/* Drawer content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none">
              {children}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
