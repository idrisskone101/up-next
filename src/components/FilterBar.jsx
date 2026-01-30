import { motion } from "framer-motion";
import { Film, Tv, LayoutGrid } from "lucide-react";
import { haptics } from "../lib/haptics";
import { springConfigs } from "../lib/animations";

const typeOptions = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "movie", label: "Movies", icon: Film },
  { value: "tv", label: "TV", icon: Tv },
];

export function FilterBar({
  activeType = "all",
  onTypeChange,
}) {
  return (
    <div className="flex items-center gap-3 mb-6 overflow-x-auto scrollbar-none py-1">
      {/* Type filter */}
      <div className="flex gap-1 shrink-0">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? "bg-brand-golden text-[#481B13] border border-brand-golden shadow-[0_0_10px_rgba(238,199,69,0.35)]"
                  : "bg-white/80 text-gray-700 border border-gray-300 hover:text-brand-red hover:bg-white hover:border-brand-red/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">{label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
