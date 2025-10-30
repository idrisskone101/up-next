// components/ui/spinner.tsx
import { Loader2 } from "lucide-react";
import React from "react";
import { cn } from "../../lib/utils";

type SpinnerProps = {
  size?: number;       // px size
  className?: string;  // extra classes (e.g. text-primary)
  ariaLabel?: string;  // for accessibility
  message?: string;    // message to display while loading
};

export function Spinner({ size = 20, className, ariaLabel, message }: SpinnerProps) {
  const displayLabel = ariaLabel || message || "Loading…";
  
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={displayLabel}
      className={cn("inline-flex flex-col items-center justify-center gap-3 font-sans", className)}
    >
      <Loader2
        className="animate-spin"
        style={{ width: size, height: size }}
      />
      {message && (
        <span className="text-sm font-sans">{message}</span>
      )}
    </span>
  );
}
