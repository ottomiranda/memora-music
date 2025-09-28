import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  isAtTop?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ 
  name, 
  size = 'md', 
  className, 
  onClick,
  isAtTop = false 
}) => {
  const getInitial = (fullName?: string) => {
    if (!fullName) return 'U';
    return fullName.charAt(0).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  const baseClasses = 'rounded-full flex items-center justify-center font-semibold transition-all duration-300 cursor-pointer';
  
  const colorClasses = isAtTop 
    ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30 backdrop-blur-sm'
    : 'bg-memora-secondary/10 text-memora-secondary border border-memora-secondary/20 hover:bg-memora-secondary/20';

  return (
    <div
      className={cn(
        baseClasses,
        sizeClasses[size],
        colorClasses,
        onClick && 'hover:scale-105',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {getInitial(name)}
    </div>
  );
};

export default Avatar;