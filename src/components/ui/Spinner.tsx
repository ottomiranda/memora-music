import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'primary' | 'white' | 'glass';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8'
};

const variantClasses = {
  primary: 'border-memora-primary border-t-transparent',
  white: 'border-white/80 border-t-transparent',
  glass: 'border-white/40 border-t-white/80'
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
  variant = 'primary'
}) => {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      style={{
        animation: 'spin 1s linear infinite'
      }}
    />
  );
};

export default Spinner;