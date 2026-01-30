import { motion } from "framer-motion";
import { Menu, Sparkles } from "lucide-react";
import { useSidebar } from "../../contexts/SidebarContext";
import { UpNextLogo } from "../ui/UpNextLogo";
import { getRandomQuery } from "../../lib/categories";
import { haptics } from "../../lib/haptics";

/**
 * Mobile top navigation bar for hero screen
 * Shows on mobile only - brand-red horizontal bar with quick actions
 */
export function MobileTopNav({ onSurpriseMe }) {
  const { toggle } = useSidebar();

  const handleSurpriseMe = () => {
    haptics.light();
    const query = getRandomQuery();
    onSurpriseMe?.(query);
  };

  const handleOpenMenu = () => {
    haptics.light();
    toggle();
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.1 }}
      className="fixed top-0 left-0 right-0 z-[60]"
      style={{
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      {/* Main bar */}
      <div
        className="flex items-center justify-between h-14 px-4 border-b border-brand-red/20"
        style={{
          background: `linear-gradient(180deg, rgba(176, 17, 16, 1) 0%, rgba(140, 14, 13, 1) 100%)`,
        }}
      >
        {/* Left: Menu button */}
        <motion.button
          type="button"
          onClick={handleOpenMenu}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/15 hover:text-brand-golden transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </motion.button>

        {/* Center: Empty space */}
        <div className="flex-1" />

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2">
          {/* Surprise Me */}
          <motion.button
            type="button"
            onClick={handleSurpriseMe}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-golden/20 text-brand-golden hover:bg-brand-golden/30 transition-colors"
            aria-label="Surprise me"
          >
            <Sparkles className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Subtle golden accent line at bottom */}
      <div className="h-px bg-gradient-to-r from-brand-golden/0 via-brand-golden/40 to-brand-golden/0" />
    </motion.header>
  );
}
