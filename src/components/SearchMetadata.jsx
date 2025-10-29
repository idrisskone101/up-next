import { useState } from "react";
import { ChevronDown, Zap } from "lucide-react";
import { Badge } from "./ui/badge";

/**
 * Collapsible search metadata display with visual weight indicators
 */
export function SearchMetadata({ metadata }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!metadata) return null;

  const { count, weights, weightReasoning, query, metadata: apiMetadata } = metadata;

  // Calculate strongest signal
  const strongestSignal = weights
    ? Object.entries(weights).sort((a, b) => b[1] - a[1])[0]
    : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 animate-slide-up">
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-background/75 shadow-soft backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8 opacity-70" />
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative z-10 flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-background/40 sm:p-8"
          aria-expanded={isExpanded}
          aria-label="Toggle search details"
        >
          <div className="flex flex-wrap items-center gap-6">
            {/* Match count */}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold text-foreground">
                {count}
              </span>
              <span className="text-sm uppercase tracking-widest text-muted-foreground/70">
                {count === 1 ? "match" : "matches"}
              </span>
            </div>

            {/* Weight indicators */}
            {weights && (
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(weights)
                  .sort((a, b) => b[1] - a[1])
                  .map(([key, value]) => {
                    const isStrongest = strongestSignal && key === strongestSignal[0];
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          {/* Progress bar */}
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-muted/40">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                key === "content"
                                  ? "bg-accent"
                                  : key === "vibe"
                                  ? "bg-primary"
                                  : "bg-secondary-foreground"
                              }`}
                              style={{ width: `${value * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">
                            {key}
                          </span>
                        </div>
                        {isStrongest && (
                          <Zap className="h-3 w-3 text-primary fill-primary" />
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Expand/collapse button */}
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="relative z-10 space-y-4 border-t border-border/40 p-6 sm:p-8 animate-slide-up">
            {/* Weight badges */}
            {weights && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                  Weight distribution:
                </span>
                <Badge variant="primary" className="font-mono text-xs">
                  Content {(weights.content * 100).toFixed(0)}%
                </Badge>
                <Badge variant="accent" className="font-mono text-xs">
                  Vibe {(weights.vibe * 100).toFixed(0)}%
                </Badge>
                <Badge className="font-mono text-xs">
                  Metadata {(weights.metadata * 100).toFixed(0)}%
                </Badge>
              </div>
            )}

            {/* Reasoning */}
            {weightReasoning && (
              <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
                <p className="text-sm italic leading-relaxed text-muted-foreground">
                  {weightReasoning}
                </p>
              </div>
            )}

            {/* Performance metrics */}
            {apiMetadata?.duration_ms && (
              <div className="flex items-center justify-between text-xs text-muted-foreground/60">
                <span>Search completed in {apiMetadata.duration_ms}ms</span>
                {apiMetadata.timestamp && (
                  <span>{new Date(apiMetadata.timestamp).toLocaleTimeString()}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

