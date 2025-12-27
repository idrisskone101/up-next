import { motion } from "framer-motion";
import { useSidebar } from "../../contexts/SidebarContext";

// Shared spring config - must match Sidebar.jsx exactly
const sidebarSpring = { type: "spring", stiffness: 300, damping: 24 };

/**
 * Main content area that responds to sidebar width
 * Adjusts left margin based on sidebar state
 * Full width on mobile (no sidebar offset)
 */
export function MainContent({ children }) {
  const { isOpen, isMobile } = useSidebar();

  // On mobile, no margin offset needed (sidebar is a drawer overlay)
  // On desktop, offset by sidebar width
  const marginLeft = isMobile ? 0 : isOpen ? "var(--sidebar-expanded)" : "var(--sidebar-collapsed)";

  return (
    <motion.main
      className="flex-1 min-w-0 will-change-[margin-left]"
      initial={false}
      animate={{ marginLeft }}
      transition={sidebarSpring}
    >
      {children}
    </motion.main>
  );
}
