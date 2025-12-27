import { motion } from "framer-motion";
import { springConfigs } from "../../lib/animations";

/**
 * Navigation item for sidebar
 * Collapsed: icon only with tooltip
 * Expanded: icon + label with active state
 */
export function SidebarNav({ icon: Icon, label, active, onClick, collapsed }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02, backgroundColor: "rgba(245, 158, 11, 0.06)" }}
      whileTap={{ scale: 0.98 }}
      transition={springConfigs.snappy}
      className={`
        relative group w-full transition-colors duration-200
        ${collapsed
          ? "w-11 h-11 flex items-center justify-center rounded-xl mx-auto text-white/40 hover:text-amber-300 hover:bg-amber-500/[0.08]"
          : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium"
        }
        ${active
          ? "bg-amber-500/10 text-amber-300 border-l-2 border-amber-400 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]"
          : collapsed ? "" : "text-white/55 hover:text-white/90"
        }
      `}
    >
      <Icon className={`shrink-0 ${collapsed ? "w-5 h-5" : "w-4 h-4"}`} />

      {/* Label - only when expanded */}
      {!collapsed && (
        <span className="truncate">{label}</span>
      )}

      {/* Tooltip - only when collapsed */}
      {collapsed && (
        <div className="
          absolute left-full ml-3 px-2.5 py-1.5 rounded-lg
          bg-[#0a0a0f] border border-amber-500/15
          shadow-[0_4px_20px_rgba(0,0,0,0.5),0_0_10px_rgba(245,158,11,0.05)]
          text-sm text-white/90 whitespace-nowrap
          opacity-0 invisible pointer-events-none
          group-hover:opacity-100 group-hover:visible
          transition-opacity duration-150
          z-50
        ">
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#0a0a0f]" />
        </div>
      )}
    </motion.button>
  );
}
