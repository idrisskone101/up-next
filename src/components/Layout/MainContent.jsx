/**
 * Main content area - full width (sidebar is overlay)
 */
export function MainContent({ children }) {
  return <main className="flex-1 min-w-0">{children}</main>;
}
