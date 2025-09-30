import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const paddingClasses = {
  none: '',
  sm: 'px-4 sm:px-6',
  md: 'px-4 sm:px-6 lg:px-8', 
  lg: 'px-4 sm:px-6 lg:px-8 xl:px-12'
};

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full'
};

/**
 * Componente container responsivo reutilizável
 * 
 * @param children - Conteúdo do container
 * @param className - Classes CSS adicionais
 * @param padding - Nível de padding responsivo (none, sm, md, lg)
 * @param maxWidth - Largura máxima do container
 */
export function ResponsiveContainer({ 
  children, 
  className = '', 
  padding = 'md',
  maxWidth = 'full'
}: ResponsiveContainerProps) {
  return (
    <div className={cn(
      'container mx-auto',
      paddingClasses[padding],
      maxWidth !== 'full' && maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Variante do ResponsiveContainer com padding reduzido para seções internas
 */
export function ResponsiveSection({ 
  children, 
  className = '', 
  padding = 'sm' 
}: Omit<ResponsiveContainerProps, 'maxWidth'>) {
  return (
    <div className={cn(
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Container para conteúdo centralizado com largura limitada
 */
export function ResponsiveCenteredContainer({ 
  children, 
  className = '', 
  padding = 'md',
  maxWidth = '2xl'
}: ResponsiveContainerProps) {
  return (
    <ResponsiveContainer 
      className={cn('text-center', className)}
      padding={padding}
      maxWidth={maxWidth}
    >
      {children}
    </ResponsiveContainer>
  );
}

export default ResponsiveContainer;