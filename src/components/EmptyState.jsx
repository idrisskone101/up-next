import { Search, Sparkles, Film } from "lucide-react";

/**
 * Empty state component for various scenarios
 */
export function EmptyState({ type = "no-results", query }) {
  const states = {
    "no-results": {
      icon: Search,
      title: "No matches found",
      description: `We couldn't find any titles matching "${query}". Try adjusting your search with different keywords, genres, or moods.`,
      suggestions: [
        "Try broader terms like 'action' or 'comedy'",
        "Add mood descriptors like 'cozy' or 'intense'",
        "Include time periods like '90s' or 'modern'",
      ],
    },
    "search-ready": {
      icon: Sparkles,
      title: "Ready to discover?",
      description:
        "Search by mood, genre, theme, or describe the vibe you're looking for. Our AI will find the perfect match.",
      suggestions: [
        '"cozy romantic comedies"',
        '"dark psychological thrillers"',
        '"uplifting coming-of-age stories"',
      ],
    },
    error: {
      icon: Film,
      title: "Something went wrong",
      description:
        "We hit a snag loading content. Please try again in a moment.",
      suggestions: [],
    },
  };

  const state = states[type] || states["search-ready"];
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4 py-12 text-center animate-fade-in">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-inset ring-primary/20">
        <Icon className="h-10 w-10 text-primary" />
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
          {state.title}
        </h3>
        <p className="mx-auto max-w-md text-sm text-muted-foreground/80 leading-relaxed">
          {state.description}
        </p>
      </div>

      {state.suggestions.length > 0 && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
            Try searching for:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {state.suggestions.map((suggestion, index) => (
              <span
                key={index}
                className="rounded-full border border-border/50 bg-secondary/40 px-3 py-1.5 text-sm text-secondary-foreground transition-colors hover:border-border/70 hover:bg-secondary/60"
              >
                {suggestion}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

