import { useCallback } from "react";

/**
 * Spring configurations for subtle, tasteful animations
 * Refined and elegant micro-interactions
 */
export const springConfigs = {
  // Bouncy - Subtle spring for interactions (buttons, cards)
  bouncy: {
    type: "spring",
    stiffness: 300,
    damping: 24,
    mass: 0.8,
  },

  // Snappy - Quick, crisp responses (hover states)
  snappy: {
    type: "spring",
    stiffness: 400,
    damping: 30,
    mass: 0.5,
  },

  // Wobbly - Mild spring for emphasis (now more restrained)
  wobbly: {
    type: "spring",
    stiffness: 250,
    damping: 20,
    mass: 1,
  },

  // Gentle - Smooth for large elements (modal, shared element)
  gentle: {
    type: "spring",
    stiffness: 180,
    damping: 26,
    mass: 1,
  },

  // Soft - Very subtle (fade backgrounds)
  soft: {
    type: "spring",
    stiffness: 120,
    damping: 24,
    mass: 1,
  },
};

/**
 * Card animation variants with stagger support
 */
export const cardVariants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.96,
  },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...springConfigs.bouncy,
      delay: index * 0.03,
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.15, ease: "easeOut" },
  },
  hover: {
    scale: 1.02,
    transition: springConfigs.snappy,
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

/**
 * Modal animation variants
 */
export const modalVariants = {
  hidden: {
    opacity: 0,
    y: "100%",
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfigs.gentle,
  },
  exit: {
    opacity: 0,
    y: "100%",
    scale: 0.95,
    transition: { duration: 0.3, ease: "easeIn" },
  },
};

/**
 * Backdrop animation variants
 */
export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/**
 * Badge animation variants (for match percentage)
 */
export const badgeVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: springConfigs.snappy,
  },
  hover: {
    scale: 1.05,
    transition: { duration: 0.15 },
  },
};

/**
 * Content stagger animation variants for modal
 */
export const contentContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

export const contentItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springConfigs.gentle,
  },
};

/**
 * Grid container variants for staggered children
 */
export const gridContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

/**
 * Calculate diagonal wave delay for grid items
 * Creates a ripple effect from top-left to bottom-right
 * @param {number} index - Item index in the grid
 * @param {number} columns - Number of columns in the grid
 * @param {number} baseDelay - Base delay between items (default: 0.04s)
 */
export const getDiagonalDelay = (index, columns, baseDelay = 0.04) => {
  const row = Math.floor(index / columns);
  const col = index % columns;
  // Diagonal distance from origin (0,0)
  const diagonalIndex = row + col;
  return diagonalIndex * baseDelay;
};

/**
 * Grid item variants with diagonal wave animation
 */
export const gridItemVariants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springConfigs.bouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

/**
 * Enhanced grid item variants matching query pill smoothness
 * Includes blur effect for polished entrance
 */
export const enhancedGridItemVariants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 16,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      ...springConfigs.snappy,
      opacity: { duration: 0.25, ease: "easeOut" },
      filter: { duration: 0.3 },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -8,
    filter: "blur(2px)",
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

/**
 * Card hover variants matching query pill behavior
 * scale: 1.03, y: -2 on hover (same as HeroSearchCard pills)
 */
export const cardHoverVariants = {
  initial: { scale: 1, y: 0 },
  hover: {
    scale: 1.03,
    y: -2,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      mass: 0.5,
    },
  },
  tap: {
    scale: 0.97,
    transition: { duration: 0.1 },
  },
};

/**
 * Faster diagonal delay for quicker cascade effect
 * Matches query pill stagger (30ms vs 40ms)
 */
export const getFastDiagonalDelay = (index, columns, baseDelay = 0.03) => {
  const row = Math.floor(index / columns);
  const col = index % columns;
  const diagonalIndex = row + col;
  return diagonalIndex * baseDelay;
};

/**
 * Custom hook for 3D tilt effect on mouse move
 * @param {React.RefObject} ref - Reference to the element
 * @param {number} intensity - Tilt intensity (default: 10)
 * @param {boolean} enabled - Whether tilt is enabled (default: true)
 */
export const use3DTilt = (ref, intensity = 10, enabled = true) => {
  const handleMouseMove = useCallback(
    (e) => {
      if (!ref.current || !enabled) return;

      // Check for reduced motion preference
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * intensity;
      const rotateY = ((centerX - x) / centerX) * intensity;

      ref.current.style.transform = `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
    },
    [ref, intensity, enabled]
  );

  const handleMouseLeave = useCallback(() => {
    if (ref.current) {
      ref.current.style.transform =
        "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    }
  }, [ref]);

  return { handleMouseMove, handleMouseLeave };
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Get transition config respecting reduced motion
 */
export const getTransition = (config) => {
  if (prefersReducedMotion()) {
    return { duration: 0 };
  }
  return config;
};

/**
 * Get variants that respect reduced motion preference
 * Returns empty variants (no animation) when reduced motion is preferred
 */
export const getReducedMotionVariants = (variants) => {
  if (prefersReducedMotion()) {
    return {
      hidden: {},
      visible: {},
      exit: {},
    };
  }
  return variants;
};

/**
 * Sidebar/nav item stagger variants
 */
export const navContainerVariants = {
  collapsed: { opacity: 0 },
  expanded: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.1 },
  },
};

export const navItemVariants = {
  collapsed: { opacity: 0, x: -10 },
  expanded: { opacity: 1, x: 0, transition: springConfigs.snappy },
};

/**
 * List item entrance variants for staggered lists
 */
export const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
};

export const listItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springConfigs.snappy,
  },
  exit: { opacity: 0, x: -8, transition: { duration: 0.15 } },
};
