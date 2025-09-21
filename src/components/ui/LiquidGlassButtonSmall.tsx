import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface LiquidGlassButtonSmallProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const LiquidGlassButtonSmall: React.FC<LiquidGlassButtonSmallProps> = ({
  children,
  onClick,
  disabled = false,
  className,
  type = 'button',
}) => {
  return (
    <Button
      variant="glassGold"
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

LiquidGlassButtonSmall.displayName = 'LiquidGlassButtonSmall';