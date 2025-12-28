import { motion } from "framer-motion";
import { Search, Heart, User, Menu } from "lucide-react";
import { haptics } from "../lib/haptics";

/**
 * iOS-style bottom navigation bar
 * Shows Menu, Search, Watchlist, and Profile tabs
 */
export function BottomNav({ activeTab = "search", onTabChange, onOpenMenu, hidden = false }) {
  const tabs = [
    { id: "menu", label: "Menu", icon: Menu, action: "openMenu" },
    { id: "search", label: "Search", icon: Search },
    { id: "watchlist", label: "Watchlist", icon: Heart },
    { id: "profile", label: "Profile", icon: User },
  ];

  const handleTabPress = (tab) => {
    haptics.light();
    if (tab.action === "openMenu") {
      onOpenMenu?.();
    } else {
      onTabChange?.(tab.id);
    }
  };

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-40"
      initial={{ y: 0 }}
      animate={{ y: hidden ? 100 : 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
    >
      {/* Glass background */}
      <div className="bg-black/70 backdrop-blur-2xl border-t border-white/10">
        {/* Tab container with safe area padding */}
        <div className="flex items-center justify-around px-6 pt-2 pb-safe">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id && !tab.action;
            const isDisabled = tab.id !== "search" && tab.id !== "menu"; // Menu and search active

            return (
              <motion.button
                key={tab.id}
                onClick={() => !isDisabled && handleTabPress(tab)}
                className={`flex flex-col items-center gap-1 py-2 px-4 min-w-[64px] rounded-xl transition-colors ${
                  isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                }`}
                whileTap={!isDisabled ? { scale: 0.9 } : undefined}
              >
                <motion.div
                  className={`p-1.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-amber-500/20"
                      : "bg-transparent"
                  }`}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Icon
                    className={`h-5 w-5 transition-colors duration-200 ${
                      isActive
                        ? "text-amber-400"
                        : "text-white/50"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </motion.div>
                <span
                  className={`text-[10px] font-medium transition-colors duration-200 ${
                    isActive
                      ? "text-amber-400"
                      : "text-white/50"
                  }`}
                >
                  {tab.label}
                </span>
                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-amber-400"
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
