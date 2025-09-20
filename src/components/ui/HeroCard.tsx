import React from 'react';
import { cn } from '@/lib/utils';

export interface HeroCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact';
  size?: 'sm' | 'md' | 'lg';
}

const HeroCard = React.forwardRef<HTMLDivElement, HeroCardProps>(
  ({ children, className, variant = 'default', size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-8 py-6 gap-4 max-w-xl',
      md: 'px-12 py-10 gap-6 max-w-2xl',
      lg: 'px-16 py-14 gap-8 max-w-3xl'
    };

    const variantClasses = {
      default: 'bg-gradient-to-br from-purple-900/30 via-indigo-900/25 to-pink-900/20',
      compact: 'bg-gradient-to-br from-purple-900/40 via-indigo-900/35 to-pink-900/30'
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Base classes - mantendo exatamente as mesmas do Hero.tsx
          'inline-flex flex-col items-center backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 mx-auto',
          // Variant classes
          variantClasses[variant],
          // Size classes
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

HeroCard.displayName = 'HeroCard';

export { HeroCard };