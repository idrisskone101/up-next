import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook to persist state to localStorage
 * Syncs across tabs via storage event
 * @param {string} key - localStorage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {[any, function]} - [value, setValue] tuple
 */
export function useLocalStorage(key, defaultValue) {
  // Initialize state from localStorage or default
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return defaultValue;

    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Persist to localStorage when value changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage may be full or disabled
    }
  }, [key, value]);

  // Sync across tabs
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValue(JSON.parse(e.newValue));
        } catch {
          // Invalid JSON, ignore
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  // Wrapped setter that also persists
  const setStoredValue = useCallback((newValue) => {
    setValue((prev) => {
      const resolved = typeof newValue === "function" ? newValue(prev) : newValue;
      return resolved;
    });
  }, []);

  return [value, setStoredValue];
}
