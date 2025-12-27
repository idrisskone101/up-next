import { useEffect, useCallback } from "react";

/**
 * Custom hook to register global keyboard shortcuts
 * Handles both Cmd+K (Mac) and Ctrl+K (Windows)
 *
 * @param {string} key - Key to listen for (e.g., 'k', 'Escape')
 * @param {Object} modifiers - Modifier keys required
 * @param {boolean} modifiers.meta - Require Cmd/Ctrl
 * @param {boolean} modifiers.shift - Require Shift
 * @param {boolean} modifiers.alt - Require Alt/Option
 * @param {Function} callback - Function to call when shortcut triggered
 * @param {boolean} enabled - Whether shortcut is active (default: true)
 */
export function useKeyboardShortcut(key, modifiers = {}, callback, enabled = true) {
  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled) return;

      // Check if key matches (case-insensitive)
      const keyMatches = event.key.toLowerCase() === key.toLowerCase();
      if (!keyMatches) return;

      // Check meta/ctrl modifier (Cmd on Mac, Ctrl on Windows/Linux)
      if (modifiers.meta) {
        const metaPressed = event.metaKey || event.ctrlKey;
        if (!metaPressed) return;
      }

      // Check shift modifier
      if (modifiers.shift && !event.shiftKey) return;

      // Check alt modifier
      if (modifiers.alt && !event.altKey) return;

      // Prevent default browser behavior (e.g., Cmd+K in browsers)
      event.preventDefault();
      event.stopPropagation();

      callback(event);
    },
    [key, modifiers, callback, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}
