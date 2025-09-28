import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
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

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  variant = 'white'
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

// Componente de loading com efeito glassmorphism mais elaborado
export const GlassLoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className
}) => {
  return (
    <div className={cn('relative inline-block', sizeClasses[size], className)}>
      {/* Spinner principal com maior visibilidade */}
      <div 
        className="absolute inset-0 rounded-full border-2 border-white/50 border-t-white animate-spin"
        style={{
          animation: 'spin 0.8s linear infinite'
        }}
      />
      {/* Efeito de brilho mais visível */}
      <div 
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/80 animate-spin"
        style={{
          animation: 'spin 1.2s linear infinite reverse'
        }}
      />
      {/* Ponto central mais visível */}
      <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
};

// Componente de loading com texto
export const LoadingWithText: React.FC<{
  text: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'white' | 'glass';
  className?: string;
}> = ({ text, size = 'md', variant = 'white', className }) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LoadingSpinner size={size} variant={variant} />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
};

// Componente de loading com efeito pulsante (alternativa)
export const PulseLoader: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className
}) => {
  const dotSize = size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-white/80 rounded-full animate-pulse',
            dotSize
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};