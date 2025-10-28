import { cn } from "../../lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "surface rounded-2xl border border-border/60 bg-card/85 text-card-foreground shadow-soft",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 px-6 pt-6 md:px-8 md:pt-8", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold leading-tight tracking-[-0.01em]",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn("text-sm text-muted-foreground leading-relaxed", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return (
    <div
      className={cn("px-6 pb-6 md:px-8 md:pb-8 pt-4 md:pt-6", className)}
      {...props}
    />
  );
}
