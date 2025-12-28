import { SidebarProvider, useSidebar } from "../../contexts/SidebarContext";
import { CommandPaletteProvider } from "../../contexts/CommandPaletteContext";
import { Sidebar } from "../Sidebar";
import { MainContent } from "./MainContent";
import { CommandPalette } from "../CommandPalette";

/**
 * Inner layout component that has access to sidebar context
 */
function LayoutContent({ children, onSearch, onSurpriseMe, onCategorySelect, onHome }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar
        onSearch={onSearch}
        onSurpriseMe={onSurpriseMe}
        onCategorySelect={onCategorySelect}
        onHome={onHome}
      />
      <MainContent>{children}</MainContent>
    </div>
  );
}

/**
 * Root layout component
 * Wraps entire app with sidebar and command palette context
 */
export function AppLayout({ children, onSearch, onSurpriseMe, onCategorySelect, onHome }) {
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
          onHome={onHome}
        >
          {children}
        </LayoutContent>
        <CommandPalette />
      </CommandPaletteProvider>
    </SidebarProvider>
  );
}
