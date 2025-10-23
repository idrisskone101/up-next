/**
 * Elegant loading spinner component
 */
export function LoadingSpinner({ message = "Searching..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 border-4 border-purple-400/30 rounded-full"></div>

        {/* Spinning ring */}
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-purple-400 rounded-full animate-spin"></div>
      </div>

      {message && (
        <p className="mt-6 text-white/70 text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
