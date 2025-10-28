import { cn } from "../../lib/utils";

const variantStyles = {
  default:
    "bg-secondary/70 text-secondary-foreground border border-border/50",
  primary: "bg-primary/15 text-primary border border-primary/30",
  accent: "bg-accent/15 text-accent border border-accent/25",
  outline:
    "border border-border/60 bg-transparent text-foreground/70 shadow-inner-glow",
};

export function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
