import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const liquidGlassVariants = cva(
  // Base styles - Liquid Glass effect
  "relative overflow-hidden backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-br from-white/10 via-white/5 to-transparent",
          "shadow-[0_8px_32px_rgba(31,38,135,0.37),inset_0_1px_0_rgba(255,255,255,0.3)]",
          "hover:shadow-[0_12px_40px_rgba(31,38,135,0.45),inset_0_1px_0_rgba(255,255,255,0.4)]",
          "hover:bg-gradient-to-br hover:from-white/15 hover:via-white/8 hover:to-white/5",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
        ],
        secondary: [
          "bg-gradient-to-br from-gray-100/10 via-gray-50/5 to-transparent",
          "shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "hover:shadow-[0_12px_40px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.3)]",
          "hover:bg-gradient-to-br hover:from-gray-100/15 hover:via-gray-50/8 hover:to-gray-100/5",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-gray-100/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
        ],
        coral: [
          "bg-gradient-to-br from-orange-100/15 via-pink-50/10 to-transparent",
          "shadow-[0_8px_32px_rgba(251,146,60,0.2),inset_0_1px_0_rgba(255,255,255,0.3)]",
          "hover:shadow-[0_12px_40px_rgba(251,146,60,0.3),inset_0_1px_0_rgba(255,255,255,0.4)]",
          "hover:bg-gradient-to-br hover:from-orange-100/20 hover:via-pink-50/15 hover:to-orange-50/8",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-orange-100/15 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
        ]
      },
      size: {
        sm: "p-4 rounded-lg",
        md: "p-6 rounded-xl",
        lg: "p-8 rounded-2xl"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface LiquidGlassCardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof liquidGlassVariants> {
  children: React.ReactNode;
}

/**
 * Componente de card com efeito Liquid Glass inspirado no design da Apple.
 * Implementa backdrop-blur, gradientes sutis, bordas translúcidas e efeitos de hover.
 */
export const LiquidGlassCard = React.forwardRef<HTMLDivElement, LiquidGlassCardProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(liquidGlassVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

LiquidGlassCard.displayName = "LiquidGlassCard";
