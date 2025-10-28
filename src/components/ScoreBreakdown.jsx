/**
 * Visual score breakdown component with progress bars
 */
export function ScoreBreakdown({
  contentScore,
  vibeScore,
  metadataScore,
  combinedScore,
  strongestSignal,
}) {
  const scoreData = [
    {
      label: "Content",
      score: contentScore,
      color: "bg-primary",
      isStrongest: strongestSignal === "content",
    },
    {
      label: "Vibe",
      score: vibeScore,
      color: "bg-accent",
      isStrongest: strongestSignal === "vibe",
    },
    {
      label: "Metadata",
      score: metadataScore,
      color: "bg-foreground/30",
      isStrongest: strongestSignal === "metadata",
    },
  ];

  const formatScore = (score) => {
    return score ? (score * 100).toFixed(1) : "0.0";
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/40 bg-background/60 p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Combined match
            </p>
            <p className="text-sm text-muted-foreground/80">
              Weighted blend across semantic vectors
            </p>
          </div>
          <span className="text-2xl font-semibold text-primary">
            {formatScore(combinedScore)}%
          </span>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary/80 transition-all duration-500"
            style={{ width: `${(combinedScore || 0) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {scoreData.map(({ label, score, color, isStrongest }) => (
          <div key={label} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                  {label}
                </span>
                {isStrongest && (
                  <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                    Strongest
                  </span>
                )}
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {formatScore(score)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/30">
              <div
                className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${(score || 0) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
