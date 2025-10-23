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
      color: "bg-blue-400",
      isStrongest: strongestSignal === "content",
    },
    {
      label: "Vibe",
      score: vibeScore,
      color: "bg-cyan-400",
      isStrongest: strongestSignal === "vibe",
    },
    {
      label: "Metadata",
      score: metadataScore,
      color: "bg-blue-400",
      isStrongest: strongestSignal === "metadata",
    },
  ];

  const formatScore = (score) => {
    return score ? (score * 100).toFixed(1) : "0.0";
  };

  return (
    <div className="space-y-3">
      {/* Combined score */}
      <div className="mb-4 pb-4 border-b border-white/10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-white">
            Combined Match
          </span>
          <span className="text-lg font-bold text-cyan-300 font-mono">
            {formatScore(combinedScore)}%
          </span>
        </div>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full transition-all duration-500"
            style={{ width: `${combinedScore * 100}%` }}
          />
        </div>
      </div>

      {/* Individual scores */}
      <div className="space-y-2.5">
        {scoreData.map(({ label, score, color, isStrongest }) => (
          <div key={label}>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/70">{label}</span>
                {isStrongest && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-yellow-400/20 text-yellow-300 rounded-full">
                    Strongest
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-white/80">
                {formatScore(score)}%
              </span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full ${color} rounded-full transition-all duration-500`}
                style={{ width: `${(score || 0) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
