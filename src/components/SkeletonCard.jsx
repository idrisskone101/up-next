import { motion } from "framer-motion";

/**
 * Skeleton loader for movie cards matching the updated MovieCard design
 * Uses shimmer effect with amber brand colors
 */
export function SkeletonCard({ index = 0 }) {
  return (
    <motion.div
      className="relative flex w-full flex-col gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      {/* Poster skeleton */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-white/[0.03] border border-white/[0.06]">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        {/* Match badge skeleton */}
        <div className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2">
          <div className="h-5 w-10 sm:h-6 sm:w-12 rounded-full bg-white/[0.08]" />
        </div>

        {/* Kind badge skeleton */}
        <div className="absolute left-1.5 top-1.5 sm:left-2 sm:top-2 hidden xs:block">
          <div className="h-4 w-10 sm:h-5 sm:w-12 rounded-full bg-white/[0.06]" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-1.5 px-0.5">
        {/* Title */}
        <div className="h-4 sm:h-5 w-3/4 rounded bg-white/[0.08]" />

        {/* Year and rating */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-10 rounded bg-white/[0.06]" />
          <div className="h-3 w-8 rounded bg-white/[0.06]" />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Skeleton grid for loading state
 */
export function SkeletonGrid({ count = 10 }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-0 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} index={i} />
        ))}
      </div>
    </div>
  );
}
