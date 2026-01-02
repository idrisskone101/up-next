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

/**
 * Drawer animation variants for right-side slide-in panel
 * Gentle spring for elegant entry, slightly faster exit that doesn't overshoot
 */
export const drawerVariants = {
  hidden: { x: "100%", opacity: 0.9 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 28,
      mass: 0.9,
    },
  },
  exit: {
    x: "100%",
    opacity: 0.85,
    transition: {
      type: "spring",
      stiffness: 320,
      damping: 32,
      mass: 0.8,
    },
  },
};

/**
 * Drawer content stagger variants
 * Faster stagger to build anticipation without feeling slow
 */
export const drawerContentContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.12,
    },
  },
};

export const drawerContentItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 26,
      mass: 0.8,
    },
  },
};

/**
 * Drawer backdrop variants
 * Slightly faster than drawer to create layered entrance feel
 */
export const drawerBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: "easeIn" } },
};

/**
 * Mobile bottom sheet animation variants
 * Critically-damped spring for entry (no overshoot), gravity-like exit
 */
export const bottomSheetVariants = {
  hidden: { y: "100%" },
  partial: {
    y: 0,
    height: "60vh",
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 40,
      mass: 0.8,
    },
  },
  full: {
    y: 0,
    height: "90vh",
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 40,
      mass: 0.8,
    },
  },
  exit: {
    y: "100%",
    transition: {
      duration: 0.28,
      ease: [0.4, 0, 0.6, 1], // Gravity-like ease-in
    },
  },
};

/**
 * Bottom sheet drag release spring - critically damped for no overshoot
 */
export const bottomSheetDragSpring = {
  type: "spring",
  stiffness: 500,
  damping: 40,
  mass: 0.8,
};

/**
 * Bottom sheet backdrop variants - staggered timing for layered feel
 * Entry: backdrop appears 50ms before sheet
 * Exit: backdrop fades 50ms after sheet starts
 */
export const bottomSheetBackdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      delay: 0.05,
      duration: 0.22,
      ease: "easeIn",
    },
  },
};

/**
 * Vibe/genre chip micro-interaction variants
 * Subtle hover + definitive tap feedback
 */
export const chipVariants = {
  initial: { scale: 1, opacity: 1 },
  hover: {
    scale: 1.02,
    filter: "brightness(1.1)",
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
  tap: {
    scale: 0.96,
    transition: { duration: 0.1 },
  },
};

/**
 * Play button pulse animation
 * Subtle scale pulse to draw attention
 */
export const playButtonPulse = {
  scale: [1, 1.05, 1],
  opacity: [0.9, 1, 0.9],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

/**
 * Cast list stagger variants
 * Subtle horizontal entrance for cast chips
 */
export const castContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

export const castItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 28,
    },
  },
};

/**
 * Bottom sheet gesture thresholds
 */
export const bottomSheetThresholds = {
  dismissVelocity: 500,   // Fast flick down = dismiss
  expandVelocity: 300,    // Fast flick up = expand
  dismissPosition: 0.5,   // 50% drag down = dismiss
  expandPosition: 0.3,    // 30% drag up = expand
  collapsePosition: 0.35, // 35% drag down from full = collapse
};

/**
 * Bottom sheet V2 - single-state (85vh) with critically damped entry
 */
export const bottomSheetEntrySpring = {
  type: "spring",
  stiffness: 500,
  damping: 40,
  mass: 1,
};

export const bottomSheetExitTransition = {
  duration: 0.28,
  ease: [0.32, 0, 0.67, 0], // cubic ease-in (gravity feel)
};

export const bottomSheetVariantsV2 = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    height: "85vh",
    transition: bottomSheetEntrySpring,
  },
  exit: {
    y: "100%",
    transition: bottomSheetExitTransition,
  },
};

/**
 * Card info overlay variants - fades in with slight slide up
 * Graceful exit prevents "pop" effect
 */
export const cardOverlayVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 30,
      delay: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: 6,
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 1, 1], // ease-in for exits
    },
  },
};

/**
 * Card action button variants with staggered entrance
 * Builds anticipation without feeling slow
 */
export const cardButtonVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 4 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 26,
      delay: 0.12 + i * 0.04,
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 2,
    transition: { duration: 0.12, ease: [0.4, 0, 1, 1] },
  },
};

// ============================================
// MENTION FEATURE ANIMATIONS
// ============================================

/**
 * Mention dropdown container - slides down from above with spring
 * Exit is quick fade-up to avoid lingering
 */
export const mentionDropdownVariants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.96,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 28,
      mass: 0.8,
      filter: { duration: 0.2 },
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.98,
    filter: "blur(2px)",
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/**
 * Mention dropdown list container - orchestrates stagger
 */
export const mentionListContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.015,
      staggerDirection: -1,
    },
  },
};

/**
 * Mention dropdown item - subtle slide from left
 */
export const mentionItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 26,
    },
  },
  exit: {
    opacity: 0,
    x: -4,
    transition: { duration: 0.1 },
  },
};

/**
 * Mention chip - satisfying spring pop on insert
 * Exit scales down and slides left
 */
export const mentionChipVariants = {
  hidden: {
    opacity: 0,
    scale: 0.7,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 22,
      mass: 0.9,
      filter: { duration: 0.2 },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    x: -8,
    filter: "blur(2px)",
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/**
 * Mention chip remove button - fades in on hover
 */
export const mentionRemoveButtonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.15, ease: "easeOut" },
  },
  tap: {
    scale: 0.85,
    transition: { duration: 0.08 },
  },
};

/**
 * Loading skeleton shimmer animation
 */
export const skeletonShimmer = {
  initial: { backgroundPosition: "-200% 0" },
  animate: {
    backgroundPosition: "200% 0",
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

/**
 * Empty state fade-in
 */
export const emptyStateVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: "easeOut",
      delay: 0.1,
    },
  },
};

/**
 * Poster thumbnail hover scale
 */
export const posterThumbnailHover = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
};

/**
 * Type badge shimmer on appearance
 */
export const typeBadgeVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 450,
      damping: 28,
      delay: 0.05,
    },
  },
};

/**
 * Submit button pulse when mention selected (ready state)
 */
export const submitReadyPulse = {
  scale: [1, 1.06, 1],
  boxShadow: [
    "0 0 0 0 rgba(245,158,11,0)",
    "0 0 20px 4px rgba(245,158,11,0.3)",
    "0 0 0 0 rgba(245,158,11,0)",
  ],
  transition: {
    duration: 0.6,
    ease: "easeInOut",
  },
};

// ============================================
// MOBILE MENTION DROPDOWN ANIMATIONS
// ============================================

/**
 * Mobile inline dropdown - slides down with snappy spring
 * No blur filter on mobile for performance
 */
export const mentionDropdownMobileVariants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 35,
      mass: 0.6,
    },
  },
  exit: {
    opacity: 0,
    y: 4,
    transition: {
      duration: 0.12,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/**
 * Mobile bottom sheet for cramped viewports (<400px height)
 * Slides up from bottom with critically damped spring
 */
export const mentionBottomSheetVariants = {
  hidden: {
    opacity: 0,
    y: "100%",
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    y: "50%",
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 0.6, 1],
    },
  },
};

/**
 * Mobile backdrop overlay - quick fade
 */
export const mentionBackdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.15, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.12, ease: "easeIn" },
  },
};
