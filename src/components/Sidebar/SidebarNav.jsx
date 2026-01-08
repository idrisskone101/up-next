import { motion } from "framer-motion";
import { springConfigs } from "../../lib/animations";

/**
 * Navigation item for sidebar
 * Collapsed: icon only with tooltip + pop animation on collapse
 * Expanded: icon + label with active state
 */
export function SidebarNav({ icon: Icon, label, active, onClick, collapsed, popOnCollapse }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
      whileTap={{ scale: 0.98 }}
      transition={springConfigs.snappy}
      className={`
        relative group w-full transition-colors duration-200
        ${collapsed
          ? "w-11 h-11 flex items-center justify-center rounded-xl mx-auto text-white/70 hover:text-brand-golden hover:bg-white/10"
          : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium"
        }
        ${active
          ? "bg-white/15 text-brand-golden border-l-2 border-brand-golden shadow-[inset_0_0_20px_rgba(238,199,69,0.1)]"
          : collapsed ? "" : "text-white/70 hover:text-brand-golden hover:bg-white/10"
        }
      `}
    >
      {/* Icon with pop animation when collapsing */}
      <motion.div
        initial={false}
        animate={
          collapsed && popOnCollapse
            ? { scale: [1, 1.3, 1], rotate: [0, -8, 8, 0] }
            : { scale: 1, rotate: 0 }
        }
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 15,
          duration: 0.4,
        }}
      >
        <Icon className={`shrink-0 ${collapsed ? "w-5 h-5" : "w-4 h-4"}`} />
      </motion.div>

      {/* Label - only when expanded */}
      {!collapsed && (
        <span className="truncate">{label}</span>
      )}

      {/* Tooltip - only when collapsed */}
      {collapsed && (
        <div className="
          absolute left-full ml-3 px-2.5 py-1.5 rounded-lg
          bg-brand-red border border-brand-golden/30
          shadow-lg
          text-sm text-white whitespace-nowrap
          opacity-0 invisible pointer-events-none
          group-hover:opacity-100 group-hover:visible
          transition-opacity duration-150
          z-50
        ">
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-brand-red" />
        </div>
      )}
    </motion.button>
  );
}
