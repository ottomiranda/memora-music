import React from 'react';
import { cn } from '@/lib/utils';

interface PublicMiniProgressProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient' | 'minimal';
}

export default function PublicMiniProgress({
  progress,
  className,
  showPercentage = false,
  size = 'md',
  variant = 'default'
}: PublicMiniProgressProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const variantClasses = {
    default: 'bg-gray-200',
    gradient: 'bg-gradient-to-r from-gray-200 to-gray-300',
    minimal: 'bg-gray-100'
  };

  const progressClasses = {
    default: 'bg-blue-600',
    gradient: 'bg-gradient-to-r from-purple-600 to-blue-600',
    minimal: 'bg-gray-600'
  };

  return (
    <div className={cn('w-full space-y-1', className)}>
      <div className={cn(
        'relative overflow-hidden rounded-full',
        sizeClasses[size],
        variantClasses[variant]
      )}>
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            progressClasses[variant]
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      
      {showPercentage && (
        <div className="text-xs text-gray-500 text-center">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
}