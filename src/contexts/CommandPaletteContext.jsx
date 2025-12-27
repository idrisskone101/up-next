import { createContext, useContext, useCallback, useState } from "react";
import { useKeyboardShortcut } from "../hooks/useKeyboardShortcut";

const CommandPaletteContext = createContext(null);

/**
 * Provider for command palette state
 * Sets up Cmd+K / Ctrl+K shortcut and Esc to close
 */
export function CommandPaletteProvider({ children, onSearch, onSurpriseMe, onBrowseCategories }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery("");
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) setQuery("");
      return !prev;
    });
  }, []);

  // Cmd+K / Ctrl+K to toggle palette
  useKeyboardShortcut("k", { meta: true }, toggle);

  // Escape to close (only when open)
  useKeyboardShortcut("Escape", {}, close, isOpen);

  return (
    <CommandPaletteContext.Provider
      value={{
        isOpen,
        query,
        setQuery,
        open,
        close,
        toggle,
        onSearch,
        onSurpriseMe,
        onBrowseCategories,
      }}
    >
      {children}
    </CommandPaletteContext.Provider>
  );
}

/**
 * Hook to access command palette state and controls
 */
export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error("useCommandPalette must be used within a CommandPaletteProvider");
  }
  return context;
}
