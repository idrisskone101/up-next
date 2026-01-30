import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { springConfigs } from "../../lib/animations";
import { haptics } from "../../lib/haptics";

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

// Animation variants for backdrop - synced with drawer spring
const backdropVariants = {
  closed: {
    opacity: 0,
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] }, // easeIn for exit
  },
  open: {
    opacity: 1,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] }, // easeOut for entry
  },
};

/**
 * Mobile slide-in drawer for sidebar navigation
 * Features:
 * - Slides from left edge
 * - Dimmed backdrop tap to close
 * - Close button in header
 * - Respects safe areas
 */
export function MobileDrawer({ isOpen, onClose, children, logo }) {
  const drawerRef = useRef(null);

  const handleClose = () => {
    haptics.light();
    onClose();
  };

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
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

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
            onClick={handleClose}
            className="fixed inset-0 z-[99] bg-brand-red/40 backdrop-blur-sm"
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
            className="fixed top-0 left-0 bottom-0 z-[100] flex w-[85vw] max-w-[320px] flex-col overflow-x-hidden overflow-y-visible border-r border-brand-red/30"
            style={{
              background: `linear-gradient(180deg, rgba(176, 17, 16, 1) 0%, rgba(140, 14, 13, 1) 100%)`,
              paddingTop: "env(safe-area-inset-top)",
              paddingLeft: "env(safe-area-inset-left)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Header with Logo and Close Button */}
            <div className="relative flex items-center justify-between px-4 h-14">
              {/* Logo */}
              {logo}
              <motion.button
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:text-brand-golden transition-colors"
                whileTap={{ scale: 0.95 }}
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Soft gradient separator */}
            <div
              className="h-px w-full bg-gradient-to-r from-transparent via-brand-golden/30 to-transparent"
              aria-hidden="true"
            />

            {/* Drawer content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none pt-3">
              {children}
            </div>

            {/* iOS Safari bottom safe area extension */}
            <div
              className="absolute left-0 right-0 bottom-0"
              style={{
                height: "env(safe-area-inset-bottom)",
                transform: "translateY(100%)",
                background: "rgba(140, 14, 13, 1)",
              }}
              aria-hidden="true"
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
