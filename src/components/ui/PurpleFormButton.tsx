import React from 'react'
import { GlassLoadingSpinner, LoadingWithText } from './LoadingSpinner'
import { cn } from '@/lib/utils'

interface PurpleFormButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  isLoading?: boolean
  loadingText?: string
  className?: string
  type?: 'button' | 'submit' | 'reset'
  loadingVariant?: 'spinner' | 'text' | 'glass'
  iconPosition?: 'left' | 'right'
  'data-attr'?: string
}

export const PurpleFormButton: React.FC<PurpleFormButtonProps> = ({
  children,
  onClick,
  disabled = false,
  isLoading = false,
  loadingText = 'Carregando...',
  className = '',
  type = 'button',
  loadingVariant = 'glass',
  iconPosition = 'left',
  ...props
}) => {


  const renderLoadingContent = () => {
    switch (loadingVariant) {
      case 'glass':
        return (
          <div className="flex items-center justify-center gap-3 w-full min-h-[20px]">
            <div className="flex-shrink-0">
              <GlassLoadingSpinner size="sm" className="" />
            </div>
            <span className="text-sm font-medium whitespace-nowrap text-white">{loadingText}</span>
          </div>
        );
      case 'text':
        return (
          <div className="flex items-center justify-center w-full min-h-[20px]">
            <LoadingWithText 
              text={loadingText} 
              size="sm" 
              variant="white"
              className="justify-center"
            />
          </div>
        );
      case 'spinner':
      default:
        return (
          <div className="flex items-center justify-center gap-3 w-full min-h-[20px]">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/60 border-t-white flex-shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap text-white">{loadingText}</span>
          </div>
        );
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'liquid-glass-button bg-transparent text-white',
        '!px-4 !py-2.5 !rounded-xl',
        'shadow-xl shadow-black/20 glow-effect',
        'font-medium transition-all duration-300 ease-in-out',
        'hover:scale-[1.02] active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'relative overflow-hidden',
        isLoading && 'pointer-events-none',
        className
      )}
      {...props}
    >
      {/* Efeito de brilho durante loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
      )}
      
      <div className={cn(
        'relative z-10 transition-all duration-200 flex items-center justify-center w-full min-h-[1.25rem]',
        iconPosition === 'right' ? 'flex-row-reverse' : 'flex-row'
      )}>
        {isLoading ? renderLoadingContent() : (
          <div className={cn(
            'flex items-center justify-center',
            iconPosition === 'right' ? 'flex-row-reverse gap-2' : 'gap-2'
          )}>
            {children}
          </div>
        )}
      </div>
    </button>
  )
}