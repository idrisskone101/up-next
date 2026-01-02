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
            className="fixed top-0 left-0 bottom-0 z-[100] flex w-[85vw] max-w-[320px] flex-col overflow-hidden border-r border-white/[0.06] bg-[#0a0a0f]"
            style={{
              backgroundImage: `
                linear-gradient(180deg, rgba(18, 18, 20, 0.95) 0%, rgba(10, 10, 12, 1) 100%),
                radial-gradient(ellipse at 30% 5%, rgba(245, 158, 11, 0.04) 0%, transparent 60%)
              `,
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
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors"
                whileTap={{ scale: 0.95 }}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Soft gradient separator */}
            <div
              className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
              aria-hidden="true"
            />

            {/* Drawer content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none pt-3">
              {children}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
