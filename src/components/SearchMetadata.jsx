import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Zap, Film, Palette, Tag, Clock } from "lucide-react";
import { Badge } from "./ui/badge";

/**
 * Signal configuration for visual styling
 */
const signalConfig = {
  content: {
    label: "content",
    icon: Film,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    barColor: "bg-blue-500",
    borderColor: "border-blue-500/30",
  },
  vibe: {
    label: "vibe",
    icon: Palette,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    barColor: "bg-purple-500",
    borderColor: "border-purple-500/30",
  },
  metadata: {
    label: "metadata",
    icon: Tag,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    barColor: "bg-amber-500",
    borderColor: "border-amber-500/30",
  },
};

/**
 * Collapsible search metadata display with visual weight indicators
 */
export function SearchMetadata({ metadata }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!metadata) return null;

  const { count, totalCount, page, totalPages, weights, weightReasoning, query, metadata: apiMetadata } = metadata;

  // Calculate strongest signal
  const strongestSignal = weights
    ? Object.entries(weights).sort((a, b) => b[1] - a[1])[0]
    : null;

  // Format pagination info
  const paginationInfo = totalCount !== undefined
    ? totalCount > count
      ? `Showing ${count} of ${totalCount}${page && totalPages ? ` (page ${page} of ${totalPages})` : ''}`
      : `${count}`
    : `${count}`;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <motion.div
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-black/40 backdrop-blur-xl"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative z-10 flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
          aria-expanded={isExpanded}
          aria-label="Toggle search details"
        >
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* Match count */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground tabular-nums">
                  {count}
                </span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground/60">
                  {count === 1 ? "match" : "matches"}
                </span>
              </div>
              {totalCount !== undefined && totalCount > count && (
                <span className="text-[11px] text-muted-foreground/50">
                  {paginationInfo}
                </span>
              )}
            </div>

            {/* Weight indicators as pills */}
            {weights && (
              <div className="hidden sm:flex items-center gap-2">
                {Object.entries(weights)
                  .sort((a, b) => b[1] - a[1])
                  .map(([key, value]) => {
                    const config = signalConfig[key];
                    const isStrongest = strongestSignal && key === strongestSignal[0];
                    const Icon = config.icon;

                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 px-2.5 py-1 rounded-full border ${config.borderColor} ${config.bgColor}`}
                      >
                        {/* Mini progress bar */}
                        <div className="h-1.5 w-10 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className={`h-full rounded-full ${config.barColor}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${value * 100}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          />
                        </div>
                        <span className={`text-[11px] font-medium ${config.color}`}>
                          {key}
                        </span>
                        {isStrongest && (
                          <Zap className={`h-3 w-3 ${config.color} fill-current`} />
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Expand/collapse button */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
          </motion.div>
        </button>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="relative z-10 space-y-4 border-t border-white/[0.06] px-5 py-4"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Weight distribution as detailed bars */}
              {weights && (
                <div className="space-y-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                    Weight distribution
                  </span>
                  <div className="grid gap-2">
                    {Object.entries(weights)
                      .sort((a, b) => b[1] - a[1])
                      .map(([key, value]) => {
                        const config = signalConfig[key];
                        const Icon = config.icon;
                        return (
                          <div key={key} className="flex items-center gap-3">
                            <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                            <span className="text-xs text-muted-foreground w-16">{key}</span>
                            <div className="flex-1 h-2 overflow-hidden rounded-full bg-white/5">
                              <motion.div
                                className={`h-full rounded-full ${config.barColor}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${value * 100}%` }}
                                transition={{ duration: 0.4 }}
                              />
                            </div>
                            <span className={`text-xs font-mono ${config.color}`}>
                              {(value * 100).toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Reasoning */}
              {weightReasoning && (
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-xs italic leading-relaxed text-muted-foreground/70">
                    "{weightReasoning}"
                  </p>
                </div>
              )}

              {/* Performance metrics */}
              {apiMetadata?.duration_ms && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/40">
                  <Clock className="h-3 w-3" />
                  <span>Completed in {apiMetadata.duration_ms}ms</span>
                  {apiMetadata.timestamp && (
                    <>
                      <span>•</span>
                      <span>{new Date(apiMetadata.timestamp).toLocaleTimeString()}</span>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

