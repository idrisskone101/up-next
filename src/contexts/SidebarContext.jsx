import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useIsMobile } from "../hooks/useMediaQuery";

const SidebarContext = createContext(null);

/**
 * Provider for sidebar state management
 * - Persists desktop state to localStorage
 * - Mobile always starts collapsed, doesn't persist
 */
export function SidebarProvider({ children }) {
  const isMobile = useIsMobile();
  const [storedOpen, setStoredOpen] = useLocalStorage("sidebar-open", false);

  // Mobile override: always start collapsed, use local state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Use mobile state on mobile, persisted state on desktop
  const isOpen = isMobile ? mobileOpen : storedOpen;

  const toggle = useCallback(() => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setStoredOpen((prev) => !prev);
    }
  }, [isMobile, setStoredOpen]);

  const open = useCallback(() => {
    if (isMobile) {
      setMobileOpen(true);
    } else {
      setStoredOpen(true);
    }
  }, [isMobile, setStoredOpen]);

  const close = useCallback(() => {
    if (isMobile) {
      setMobileOpen(false);
    } else {
      setStoredOpen(false);
    }
  }, [isMobile, setStoredOpen]);

  // Reset mobile state when switching from mobile to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

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
