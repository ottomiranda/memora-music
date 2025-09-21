import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface LiquidGlassButtonWhiteSmallProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const LiquidGlassButtonWhiteSmall: React.FC<LiquidGlassButtonWhiteSmallProps> = ({
  children,
  onClick,
  disabled = false,
  className,
  type = 'button',
}) => {
  return (
    <Button
      variant="glassWhite"
      size="default"
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={cn(className)}
    >
      {children}
    </Button>
  );
};

LiquidGlassButtonWhiteSmall.displayName = 'LiquidGlassButtonWhiteSmall';