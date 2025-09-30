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
      sm: 'px-4 xs:px-6 sm:px-8 py-4 xs:py-5 sm:py-6 gap-3 xs:gap-4 max-w-sm xs:max-w-md sm:max-w-xl',
      md: 'px-6 xs:px-8 sm:px-10 md:px-12 py-6 xs:py-8 sm:py-10 gap-4 xs:gap-5 sm:gap-6 max-w-md xs:max-w-lg sm:max-w-xl md:max-w-2xl',
      lg: 'px-8 xs:px-10 sm:px-12 md:px-14 lg:px-16 py-8 xs:py-10 sm:py-12 md:py-14 gap-5 xs:gap-6 sm:gap-7 md:gap-8 max-w-lg xs:max-w-xl sm:max-w-2xl md:max-w-3xl'
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
          'inline-flex flex-col items-center backdrop-blur-xl border border-white/20 rounded-2xl xs:rounded-3xl shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 mx-auto',
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