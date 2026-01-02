import { useState, useCallback, useMemo } from "react";

/**
 * Hook for managing @mention state in search input
 * Supports single mention only
 */
export function useMentions() {
  // Selected mention: { id, title, poster_path, kind }
  const [mention, setMentionState] = useState(null);

  // Trigger state: { active, startIndex, searchText }
  const [triggerInfo, setTriggerInfo] = useState({
    active: false,
    startIndex: -1,
    searchText: "",
  });

  /**
   * Detect @ trigger in text at cursor position
   * @ must be at start or after whitespace
   */
  const detectTrigger = useCallback((text, cursorPos) => {
    // If we already have a mention, don't trigger
    if (mention) {
      setTriggerInfo({ active: false, startIndex: -1, searchText: "" });
      return;
    }

    // Find @ before cursor
    const beforeCursor = text.slice(0, cursorPos);
    const atIndex = beforeCursor.lastIndexOf("@");

    if (atIndex === -1) {
      setTriggerInfo({ active: false, startIndex: -1, searchText: "" });
      return;
    }

    // Check if @ is at start or after whitespace
    const charBefore = atIndex > 0 ? beforeCursor[atIndex - 1] : null;
    const validTrigger = charBefore === null || /\s/.test(charBefore);

    if (!validTrigger) {
      setTriggerInfo({ active: false, startIndex: -1, searchText: "" });
      return;
    }

    // Extract search text after @ (up to cursor)
    const searchText = beforeCursor.slice(atIndex + 1);

    setTriggerInfo({
      active: true,
      startIndex: atIndex,
      searchText,
    });
  }, [mention]);

  /**
   * Set the selected mention and clear trigger
   */
  const setMention = useCallback((movie) => {
    setMentionState(movie);
    setTriggerInfo({ active: false, startIndex: -1, searchText: "" });
  }, []);

  /**
   * Clear the current mention
   */
  const clearMention = useCallback(() => {
    setMentionState(null);
  }, []);

  /**
   * Close trigger dropdown without clearing mention
   */
  const closeTrigger = useCallback(() => {
    setTriggerInfo({ active: false, startIndex: -1, searchText: "" });
  }, []);

  /**
   * Reset all mention state
   */
  const resetMentions = useCallback(() => {
    setMentionState(null);
    setTriggerInfo({ active: false, startIndex: -1, searchText: "" });
  }, []);

  const hasMention = useMemo(() => mention !== null, [mention]);

  return {
    mention,
    triggerInfo,
    hasMention,
    detectTrigger,
    setMention,
    clearMention,
    closeTrigger,
    resetMentions,
  };
}
