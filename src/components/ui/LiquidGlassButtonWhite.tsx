import * as React from "react";
import { Button, type ButtonProps } from "./button";
import { cn } from "@/lib/utils";

export interface LiquidGlassButtonWhiteProps
  extends Omit<ButtonProps, "variant"> {}

/**
 * LiquidGlassButtonWhite reproduz a estética "Liquid Glass" com cores brancas translúcidas,
 * entregando um botão secundário branco com blur consistente
 * para uso em toda a aplicação web.
 */
export const LiquidGlassButtonWhite = React.forwardRef<HTMLButtonElement, LiquidGlassButtonWhiteProps>(
  ({ className, size = "lg", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="glassWhite"
        size={size}
        className={cn(className)}
        {...props}
      />
    );
  }
);

LiquidGlassButtonWhite.displayName = "LiquidGlassButtonWhite";