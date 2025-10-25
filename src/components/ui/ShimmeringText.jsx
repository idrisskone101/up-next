import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function ShimmeringText({
  text,
  duration = 1,
  wave = false,
  className,
  color = "rgb(255, 255, 255)",
  shimmeringColor = "rgb(34, 211, 238)",
  ...props
}) {
  return (
    <motion.span
      className={cn("relative inline-block", className)}
      style={{
        "--shimmering-color": shimmeringColor,
        "--color": color,
        color: "var(--color)",
      }}
      {...props}
    >
      {text?.split("")?.map((char, i) => (
        <motion.span
          key={i}
          className="inline-block whitespace-pre"
          initial={{
            ...(wave ? { scale: 1, rotateY: 0 } : {}),
            color: "var(--color)",
          }}
          animate={{
            ...(wave ? { x: [0, 5, 0], y: [0, -5, 0], scale: [1, 1.1, 1], rotateY: [0, 15, 0] } : {}),
            color: ["var(--color)", "var(--shimmering-color)", "var(--color)"],
          }}
          transition={{
            duration,
            repeat: Infinity,
            repeatType: "loop",
            repeatDelay: text.length * 0.05,
            delay: (i * duration) / text.length,
            ease: "easeInOut",
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}
