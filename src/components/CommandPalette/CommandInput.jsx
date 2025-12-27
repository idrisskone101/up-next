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
    <div className="flex items-center h-14 px-5 border-b border-white/[0.06]">
      <Search className="w-5 h-5 text-white/40 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What do you want to watch?"
        className="flex-1 h-full px-3 text-lg text-white/90 placeholder:text-white/30 bg-transparent outline-none"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
      />
      <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-white/30 bg-white/[0.04] rounded border border-white/[0.08]">
        esc
      </kbd>
    </div>
  );
}
