import React from 'react'
import { Loader2 } from 'lucide-react'

interface PurpleFormButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  isLoading?: boolean
  loadingText?: string
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export const PurpleFormButton: React.FC<PurpleFormButtonProps> = ({
  children,
  onClick,
  disabled = false,
  isLoading = false,
  loadingText = 'Carregando...',
  className = '',
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        liquid-glass-button bg-transparent text-white
        !px-4 !py-2.5 !rounded-xl
        shadow-xl shadow-black/20 glow-effect
        font-medium transition-all duration-200 ease-in-out
        hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText}
          </>
        ) : (
          children
        )}
    </button>
  )
}