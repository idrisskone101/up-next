import { motion, AnimatePresence } from "framer-motion";
import { Film, Tv, LayoutGrid, RefreshCw } from "lucide-react";
import { haptics } from "../lib/haptics";
import { springConfigs, prefersReducedMotion } from "../lib/animations";

const typeOptions = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "movie", label: "Movies", icon: Film },
  { value: "tv", label: "TV", icon: Tv },
];

const sortOptions = [
  { value: "match", label: "Match" },
  { value: "year", label: "Year" },
  { value: "rating", label: "Rating" },
];

// Container animation for stagger effect
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfigs.snappy,
  },
};

/**
 * Filter bar with type filter, sort controls, and refresh button
 */
export function FilterBar({
  activeType = "all",
  onTypeChange,
  activeSort = "match",
  onSortChange,
  onRefresh,
  isRefreshing = false,
}) {
  const reduceMotion = prefersReducedMotion();

  return (
    <motion.div
      className="flex items-center gap-3 mb-6 overflow-x-auto scrollbar-none py-1"
      variants={reduceMotion ? undefined : containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Type filter */}
      <motion.div
        variants={reduceMotion ? undefined : itemVariants}
        className="flex gap-1 shrink-0"
      >
        {typeOptions.map(({ value, label, icon: Icon }) => {
          const isActive = activeType === value;
          return (
            <motion.button
              key={value}
              onClick={() => {
                haptics.light();
                onTypeChange?.(value);
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={springConfigs.snappy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? "bg-white/10 text-white/90 border border-white/10"
                  : "text-white/50 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Divider */}
      <motion.div
        variants={reduceMotion ? undefined : itemVariants}
        className="w-px h-6 bg-white/10 shrink-0"
      />

      {/* Sort dropdown */}
      <motion.select
        variants={reduceMotion ? undefined : itemVariants}
        value={activeSort}
        onChange={(e) => {
          haptics.light();
          onSortChange?.(e.target.value);
        }}
        className="bg-white/[0.06] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80 cursor-pointer hover:bg-white/[0.08] focus:outline-none focus:border-amber-500/40 transition-colors appearance-none pr-7 shrink-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
        }}
      >
        {sortOptions.map(({ value, label }) => (
          <option key={value} value={value} className="bg-[#1a1a22] text-white">
            Sort: {label}
          </option>
        ))}
      </motion.select>

      {/* Refresh button */}
      {onRefresh && (
        <>
          <motion.div
            variants={reduceMotion ? undefined : itemVariants}
            className="w-px h-6 bg-white/10 shrink-0"
          />
          <motion.button
            variants={reduceMotion ? undefined : itemVariants}
            onClick={() => {
              if (!isRefreshing) {
                haptics.light();
                onRefresh();
              }
            }}
            disabled={isRefreshing}
            className="w-10 h-10 flex items-center justify-center rounded-full shrink-0 bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-amber-300 hover:border-amber-500/30 disabled:opacity-40 transition-all"
            whileHover={!isRefreshing ? { scale: 1.05 } : undefined}
            whileTap={!isRefreshing ? { scale: 0.95 } : undefined}
            aria-label="Refresh results"
          >
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{
                duration: 1,
                repeat: isRefreshing ? Infinity : 0,
                ease: "linear",
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </>
      )}
    </motion.div>
  );
}
