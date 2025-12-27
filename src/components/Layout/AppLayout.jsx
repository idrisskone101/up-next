import { SidebarProvider, useSidebar } from "../../contexts/SidebarContext";
import { CommandPaletteProvider } from "../../contexts/CommandPaletteContext";
import { Sidebar } from "../Sidebar";
import { MainContent } from "./MainContent";
import { CommandPalette } from "../CommandPalette";
import { useEdgeSwipe } from "../../hooks/useSwipeGesture";
import { useIsMobile } from "../../hooks/useMediaQuery";

/**
 * Inner layout component that has access to sidebar context
 */
function LayoutContent({ children, onSearch, onSurpriseMe, onCategorySelect }) {
  const { open, isOpen } = useSidebar();
  const isMobile = useIsMobile();

  // Enable edge swipe on mobile to open drawer
  useEdgeSwipe({
    onSwipeFromLeftEdge: open,
    enabled: isMobile && !isOpen,
    edgeThreshold: 20,
    minSwipeDistance: 50,
  });

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        onSearch={onSearch}
        onSurpriseMe={onSurpriseMe}
        onCategorySelect={onCategorySelect}
      />
      <MainContent>{children}</MainContent>
    </div>
  );
}

/**
 * Root layout component
 * Wraps entire app with sidebar and command palette context
 */
export function AppLayout({ children, onSearch, onSurpriseMe, onCategorySelect }) {
  return (
    <SidebarProvider>
      <CommandPaletteProvider
        onSearch={onSearch}
        onSurpriseMe={onSurpriseMe}
        onBrowseCategories={() => {}}
      >
        <LayoutContent
          onSearch={onSearch}
          onSurpriseMe={onSurpriseMe}
          onCategorySelect={onCategorySelect}
        >
          {children}
        </LayoutContent>
        <CommandPalette />
      </CommandPaletteProvider>
    </SidebarProvider>
  );
}
