"use client";

import { motion } from "framer-motion";
import { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export interface AnimatedCircularProgressBarProps
  extends ComponentPropsWithoutRef<"div"> {
  /**
   * Which value between 0 and 100 to display.
   */
  value?: number;
  /**
   * The size of the progress bar.
   * @default "sm"
   */
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * Color of the progress bar.
   * @default "primary"
   */
  color?: "primary" | "secondary" | "destructive" | "warning" | "success";
  /**
   * The thickness of the progress bar.
   * @default "md"
   */
  thickness?: "sm" | "md" | "lg";
  /**
   * Show the text inside the progress bar.
   * @default true
   */
  showText?: boolean;
  /**
   * Text to display inside the progress bar.
   */
  text?: string;
  /**
   * The gap between the progress bar and the text.
   * @default "md"
   */
  gap?: "sm" | "md" | "lg";
}

const sizeVariants = {
  sm: {
    wrapper: "h-12 w-12",
    svg: "h-12 w-12",
    text: "text-xs",
  },
  md: {
    wrapper: "h-16 w-16",
    svg: "h-16 w-16",
    text: "text-sm",
  },
  lg: {
    wrapper: "h-20 w-20",
    svg: "h-20 w-20",
    text: "text-base",
  },
  xl: {
    wrapper: "h-24 w-24",
    svg: "h-24 w-24",
    text: "text-lg",
  },
};

const colorVariants = {
  primary: "stroke-primary",
  secondary: "stroke-secondary",
  destructive: "stroke-destructive",
  warning: "stroke-yellow-500",
  success: "stroke-green-500",
};

const thicknessVariants = {
  sm: "stroke-[6]",
  md: "stroke-[8]",
  lg: "stroke-[10]",
};

export function AnimatedCircularProgressBar({
  value = 0,
  size = "md",
  color = "primary",
  thickness = "md",
  showText = true,
  text,
  gap = "md",
  className,
  ...props
}: AnimatedCircularProgressBarProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        sizeVariants[size].wrapper,
        className
      )}
      {...props}
    >
      <div className="relative">
        <svg
          className={cn(sizeVariants[size].svg, "transform -rotate-90")}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            className={cn(
              "opacity-20",
              thicknessVariants[thickness],
              colorVariants[color]
            )}
            fill="transparent"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            className={cn(thicknessVariants[thickness], colorVariants[color])}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </svg>
        {showText && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                "font-semibold",
                sizeVariants[size].text,
                colorVariants[color].replace("stroke", "text")
              )}
            >
              {text || `${Math.round(value)}%`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
