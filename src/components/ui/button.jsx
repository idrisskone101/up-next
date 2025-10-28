import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const base =
  "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:translate-y-px rounded-lg";

const variantStyles = {
  default:
    "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-foreground/5",
  ghost: "text-foreground/80 hover:bg-foreground/10 hover:text-foreground",
  subtle:
    "bg-secondary/80 text-secondary-foreground hover:bg-secondary/60 border border-border/50",
  accent: "bg-accent text-accent-foreground shadow-soft hover:bg-accent/90",
};

const sizeStyles = {
  default: "h-11 px-5 text-sm gap-2",
  sm: "h-9 px-4 text-xs gap-2 rounded-md",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
  icon: "h-11 w-11 rounded-lg",
};

export const Button = forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
