import { cn } from "../../lib/utils";

const variantStyles = {
  default:
    "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:border-gray-300 transition-colors",
  primary: "bg-brand-golden/15 text-brand-orange border border-brand-golden/30 hover:bg-brand-golden/25 hover:border-brand-golden/50 hover:text-brand-red transition-colors",
  accent: "bg-brand-cream/30 text-brand-orange border border-brand-cream hover:bg-brand-cream/50 hover:text-brand-red transition-colors",
  outline:
    "border border-gray-200 bg-transparent text-gray-600 hover:border-brand-golden/40 hover:bg-brand-golden/10 hover:text-brand-orange transition-colors",
  genre: "border border-brand-golden/30 text-brand-orange bg-brand-golden/10 hover:bg-brand-red/15 hover:border-brand-red/40 hover:text-brand-red transition-colors",
};

export function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase cursor-default",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
