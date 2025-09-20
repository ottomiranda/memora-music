import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface GlobalTextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * GlobalTextField - Componente de input com estilo glassmorphism global
 * Baseado no componente GlassInput para manter consistência visual
 */
const GlobalTextField = React.forwardRef<HTMLInputElement, GlobalTextFieldProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className="text-white/90 font-medium drop-shadow-sm">
            {label}
          </Label>
        )}
        <Input
          ref={ref}
          {...props}
          className={cn(
            "h-14 px-4",
            "bg-white/10 backdrop-blur-md",
            "border border-white/20",
            "text-white placeholder:text-white/60",
            "shadow-lg shadow-black/5",
            "transition-all duration-500 ease-out",
            "hover:bg-white/15 hover:border-white/30",
            "focus:bg-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20",
            "focus:shadow-xl focus:shadow-black/10",
            "transform hover:scale-[1.02] focus:scale-[1.02]",
            error && "border-red-400/60 focus:border-red-400/80 focus:ring-red-400/20",
            className
          )}
        />
        {error && (
          <p className="text-sm text-red-300/90 drop-shadow-sm animate-pulse">{error}</p>
        )}
      </div>
    );
  }
);

GlobalTextField.displayName = 'GlobalTextField';

export { GlobalTextField };
export type { GlobalTextFieldProps };