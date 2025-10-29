/**
 * Skeleton loader for movie cards while data is loading
 */
export function SkeletonCard() {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/40 bg-card/85 p-[1px]">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[inherit] bg-card/95">
        {/* Skeleton poster */}
        <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-primary/5 via-background/40 to-accent/5 animate-pulse">
          <div className="h-full w-full bg-muted/20" />
          
          {/* Skeleton badges */}
          <div className="absolute left-4 top-4">
            <div className="h-6 w-16 rounded-full bg-muted/30" />
          </div>
          <div className="absolute right-4 top-4">
            <div className="h-16 w-16 rounded-xl bg-muted/30" />
          </div>
        </div>

        {/* Skeleton content */}
        <div className="flex flex-1 flex-col gap-3 px-5 pb-6 pt-5 sm:px-6 sm:pb-7 sm:pt-6">
          {/* Title */}
          <div className="space-y-2">
            <div className="h-5 w-3/4 rounded-md bg-muted/30 animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-12 rounded-md bg-muted/20 animate-pulse" />
              <div className="h-3 w-3 rounded-full bg-muted/20 animate-pulse" />
              <div className="h-3 w-16 rounded-md bg-muted/20 animate-pulse" />
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            <div className="h-5 w-16 rounded-md bg-muted/20 animate-pulse" />
            <div className="h-5 w-20 rounded-md bg-muted/20 animate-pulse" />
            <div className="h-5 w-24 rounded-md bg-muted/20 animate-pulse" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-3 w-full rounded-md bg-muted/20 animate-pulse" />
            <div className="h-3 w-full rounded-md bg-muted/20 animate-pulse" />
            <div className="h-3 w-2/3 rounded-md bg-muted/20 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

