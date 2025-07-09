import React, { ComponentPropsWithoutRef, CSSProperties } from "react";

import { cn } from "@/lib/utils";

interface RippleProps extends ComponentPropsWithoutRef<"div"> {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  variant?: 'default' | 'subtle' | 'elegant';
}

export const Ripple = React.memo(function Ripple({
  mainCircleSize = 180,
  mainCircleOpacity = 0.08,
  numCircles = 6,
  variant = 'elegant',
  className,
  ...props
}: RippleProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'subtle':
        return {
          borderClass: 'border-blue-200/30',
          bgClass: 'bg-blue-50/20'
        };
      case 'elegant':
        return {
          borderClass: 'border-primary/10',
          bgClass: 'bg-primary/5'
        };
      default:
        return {
          borderClass: 'border-primary/20',
          bgClass: 'bg-primary/10'
        };
    }
  };

  const { borderClass, bgClass } = getVariantStyles();

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 select-none overflow-hidden",
        className
      )}
      {...props}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 80;
        const opacity = Math.max(0.02, mainCircleOpacity - i * 0.01);
        const animationDelay = `${i * 0.8}s`;

        return (
          <div
            key={i}
            className={cn(
              "absolute rounded-full border animate-ripple",
              borderClass,
              bgClass
            )}
            style={
              {
                "--i": i,
                width: `${size}px`,
                height: `${size}px`,
                opacity,
                animationDelay,
                animationDuration: "6s",
                animationIterationCount: "infinite",
                animationTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) scale(0.7)",
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
});

Ripple.displayName = "Ripple";
