/**
 * iOS-style haptic feedback utility
 * Uses the Vibration API with patterns that mimic iOS haptic feedback
 * Falls back gracefully on unsupported devices
 */

// Check if vibration is supported
const canVibrate = () =>
  typeof navigator !== 'undefined' &&
  'vibrate' in navigator;

// iOS-style haptic feedback patterns
export const haptics = {
  // Light tap - for selections, toggles
  light: () => {
    if (canVibrate()) {
      navigator.vibrate(10);
    }
  },

  // Medium impact - for confirmations, submissions
  medium: () => {
    if (canVibrate()) {
      navigator.vibrate(20);
    }
  },

  // Heavy impact - for significant actions
  heavy: () => {
    if (canVibrate()) {
      navigator.vibrate(30);
    }
  },

  // Success pattern - for completed actions (like pull-to-refresh)
  success: () => {
    if (canVibrate()) {
      navigator.vibrate([10, 50, 20]);
    }
  },

  // Error pattern - for failed actions
  error: () => {
    if (canVibrate()) {
      navigator.vibrate([30, 100, 30]);
    }
  },

  // Selection changed - subtle tick for scrolling through options
  selection: () => {
    if (canVibrate()) {
      navigator.vibrate(5);
    }
  },

  // Snap to detent - for bottom sheet snap points
  snap: () => {
    if (canVibrate()) {
      navigator.vibrate(15);
    }
  }
};

// Hook for React components
export const useHaptics = () => haptics;

export default haptics;
