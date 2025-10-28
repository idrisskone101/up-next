/**
 * Loading state aligned with shadcn-inspired tokens.
 */
export function LoadingSpinner({ message = "Searching..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-primary/15" />
        <div className="absolute inset-[6px] rounded-full border-2 border-transparent border-t-primary/70 animate-spin" />
        <div className="h-5 w-5 rounded-full bg-primary/20" />
      </div>

      {message && (
        <p className="mt-6 text-sm font-medium text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
