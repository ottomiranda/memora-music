import * as React from "react";
import { Button, type ButtonProps } from "./button";
import { cn } from "@/lib/utils";

export interface LiquidGlassButtonProps
  extends Omit<ButtonProps, "variant"> {}

/**
 * LiquidGlassButton reproduz a estética "Liquid Glass" descrita pela Apple,
 * entregando um botão primário dourado translúcido com blur consistente
 * para uso em toda a aplicação web.
 */
export const LiquidGlassButton = React.forwardRef<HTMLButtonElement, LiquidGlassButtonProps>(
  ({ className, size = "lg", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="glassGold"
        size={size}
        className={cn("h-14 px-8 text-base font-heading font-bold", className)}
        {...props}
      />
    );
  }
);

LiquidGlassButton.displayName = "LiquidGlassButton";
