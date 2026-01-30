import { createContext, useContext, useCallback, useState } from "react";
import { useIsMobile } from "../hooks/useMediaQuery";

const SidebarContext = createContext(null);

/**
 * Provider for sidebar state management
 * Single state for drawer (always starts closed)
 */
export function SidebarProvider({ children }) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, open, close, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * Hook to access sidebar state and controls
 * @returns {{ isOpen: boolean, toggle: () => void, open: () => void, close: () => void, isMobile: boolean }}
 */
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
