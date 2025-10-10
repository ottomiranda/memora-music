import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  message: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'warning';
  showIcon?: boolean;
}

export function ErrorMessage({
  message,
  className,
  variant = 'destructive',
  showIcon = true
}: ErrorMessageProps) {
  const variantClasses = {
    default: 'bg-gray-50 text-gray-700 border-gray-200',
    destructive: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200'
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-4 rounded-lg border',
        variantClasses[variant],
        className
      )}
      role="alert"
      aria-live="assertive"
      data-testid="error-message"
    >
      {showIcon && (
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
      )}
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}