import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-golden focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-brand-golden text-[#481B13] shadow hover:bg-brand-orange hover:text-white",
        destructive:
          "bg-brand-red text-white shadow-sm hover:bg-brand-red/90",
        outline:
          "border border-brand-cream/50 bg-[#FFFCF5] shadow-sm hover:border-brand-golden/40 hover:bg-brand-golden/10 hover:text-brand-orange",
        secondary:
          "bg-brand-cream/20 text-gray-700 shadow-sm hover:bg-brand-golden/15 hover:text-brand-orange hover:border-brand-golden/30",
        ghost: "hover:bg-brand-golden/10 hover:text-brand-orange",
        link: "text-brand-red underline-offset-4 hover:underline hover:text-brand-orange",
        accent: "bg-brand-red text-white shadow hover:bg-brand-orange",
        warm: "bg-brand-cream/30 text-brand-orange border border-brand-cream hover:bg-brand-golden/20 hover:text-brand-red hover:border-brand-golden/40",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
