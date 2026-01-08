import { useEffect, useRef } from "react";
import { Search } from "lucide-react";

/**
 * Search input at top of command palette
 * Auto-focuses when palette opens, Enter submits
 */
export function CommandInput({ value, onChange, onSubmit }) {
  const inputRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    // Small delay ensures animation is started before focus
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <div className="flex items-center h-14 px-5 border-b border-gray-200">
      <Search className="w-5 h-5 text-gray-400 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What do you want to watch?"
        className="flex-1 h-full px-3 text-lg text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
      />
      <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-gray-100 rounded border border-gray-200">
        esc
      </kbd>
    </div>
  );
}
