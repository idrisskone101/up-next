import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CommandItem } from "./CommandItem";
import { springConfigs } from "../../lib/animations";

// Stagger container for sections
const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springConfigs.snappy,
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15 },
  },
};

/**
 * Results/suggestions list with keyboard navigation
 * Arrow up/down changes selection, Enter executes
 */
export function CommandList({ items, query, onSelect }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter items based on query
  const filteredItems = query.trim()
    ? items.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.type === "action" // Always show actions
      )
    : items;

  // Reset selection when items or query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, items.length]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            onSelect(filteredItems[selectedIndex]);
          }
          break;
        default:
          break;
      }
    },
    [filteredItems, selectedIndex, onSelect]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Group items by section
  const sections = filteredItems.reduce((acc, item) => {
    const section = item.section || "OTHER";
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  // Calculate global index for each item
  let globalIndex = 0;

  return (
    <div className="overflow-y-auto max-h-[calc(480px-56px)] scrollbar-none">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.02 },
          },
        }}
      >
        {Object.entries(sections).map(([sectionName, sectionItems], sectionIndex) => (
          <motion.div
            key={sectionName}
            variants={sectionVariants}
          >
            <motion.div
              variants={headerVariants}
              className="px-4 py-2 text-xs uppercase tracking-wider text-gray-400 font-medium"
            >
              {sectionName}
            </motion.div>
            {sectionItems.map((item) => {
              const itemIndex = globalIndex++;
              return (
                <motion.div key={item.id} variants={itemVariants}>
                  <CommandItem
                    item={item}
                    selected={selectedIndex === itemIndex}
                    onClick={() => onSelect(item)}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        ))}
      </motion.div>
      {filteredItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-8 text-center text-gray-400"
        >
          No matches found
        </motion.div>
      )}
    </div>
  );
}
