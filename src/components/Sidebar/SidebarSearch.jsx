import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { springConfigs } from "../../lib/animations";

/**
 * Compact search input for sidebar
 * Only visible when sidebar is expanded
 */
export function SidebarSearch({ onSearch, collapsed }) {
  const [query, setQuery] = useState("");

  if (collapsed) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query.trim());
      setQuery("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-2.5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Quick search..."
          className="
            w-full h-10 pl-9 pr-3 rounded-xl
            bg-white/10 border border-white/20
            text-sm text-white placeholder:text-white/50
            focus:outline-none focus:border-brand-golden/60 focus:bg-white/15 focus:shadow-[0_0_16px_rgba(238,199,69,0.15)]
            transition-all duration-200
          "
        />
      </motion.div>
    </form>
  );
}
