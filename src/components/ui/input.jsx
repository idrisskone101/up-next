import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Input = forwardRef(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-brand-cream/50 bg-[#FFFCF5] px-4 py-2 text-sm text-gray-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-golden focus-visible:ring-offset-2 ring-offset-[#FAF8F0] disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-gray-400",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
