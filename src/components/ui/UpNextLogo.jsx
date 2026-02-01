import { motion } from "framer-motion";

const SIZE_CLASSES = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
  "2xl": "text-4xl",
  hero: "text-5xl sm:text-6xl"
};

// Padding scales with size to prevent clipping on cursive font
const PADDING_CLASSES = {
  sm: "py-1 px-0.5",
  md: "py-2 px-1",
  lg: "py-3 px-1",
  xl: "py-4 px-2",
  "2xl": "py-5 px-2",
  hero: "py-6 px-0"
};

export function UpNextLogo({
  size = "md",
  animated = false,
  gradient = true,
  variant = "light", // "light" for dark bg, "dark" for light bg
  className = ""
}) {
  const baseClasses = `font-display whitespace-nowrap ${SIZE_CLASSES[size]}`;
  const paddingClasses = PADDING_CLASSES[size] || "py-2 px-1";

  // Color based on variant
  const colorClasses = variant === "light"
    ? `text-brand-cream inline-block ${paddingClasses}` // Cream text for dark/red backgrounds
    : gradient
      ? `text-gray-800 inline-block ${paddingClasses}`
      : "text-gray-600 hover:text-gray-800 transition-colors";

  if (animated) {
    return (
      <motion.span
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.05 }}
        className={`${baseClasses} ${colorClasses} ${className}`}
      >
        upNext
      </motion.span>
    );
  }

  return (
    <span className={`${baseClasses} ${colorClasses} ${className}`}>
      upNext
    </span>
  );
}
