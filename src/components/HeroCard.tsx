import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface HeroCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

interface GlassSelectProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

// Componente principal HeroCard com efeito glassmorphism
export function HeroCard({ title, children, className }: HeroCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl",
      "bg-gradient-to-br from-white/20 via-white/10 to-white/5",
      "backdrop-blur-xl border border-white/20",
      "shadow-2xl shadow-black/10",
      "transition-all duration-700 ease-out",
      "hover:shadow-3xl hover:shadow-black/20",
      "hover:border-white/30",
      "before:absolute before:inset-0",
      "before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-transparent",
      "before:opacity-0 before:transition-opacity before:duration-300",
      "hover:before:opacity-100",
      "group",
      className
    )}>
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 transition-opacity duration-700 group-hover:opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)] transition-opacity duration-700 group-hover:opacity-60" />
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="text-xl font-heading font-semibold text-white drop-shadow-sm transition-all duration-500 group-hover:text-white/95 group-hover:drop-shadow-xl">
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-6">
        {children}
      </CardContent>
    </div>
  );
}

// Input com efeito glassmorphism
export function GlassInput({ label, error, className, ...props }: GlassInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={props.id} className="text-white/90 font-medium drop-shadow-sm">
          {label}
        </Label>
      )}
      <Input
        {...props}
        className={cn(
          "h-12 px-4",
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

// Textarea com efeito glassmorphism
export function GlassTextarea({ label, error, className, ...props }: GlassTextareaProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={props.id} className="text-white/90 font-medium drop-shadow-sm">
          {label}
        </Label>
      )}
      <Textarea
        {...props}
        className={cn(
          "min-h-[100px] px-4 py-3",
          "bg-white/10 backdrop-blur-md",
          "border border-white/20",
          "text-white placeholder:text-white/60",
          "shadow-lg shadow-black/5",
          "transition-all duration-500 ease-out",
          "hover:bg-white/15 hover:border-white/30",
          "focus:bg-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20",
          "focus:shadow-xl focus:shadow-black/10",
          "resize-none",
          "transform hover:scale-[1.01] focus:scale-[1.01]",
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

// Container para botões com efeito glassmorphism
export function GlassButtonGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "flex flex-wrap gap-2",
      className
    )}>
      {children}
    </div>
  );
}

// Botão com efeito glassmorphism
export function GlassButton({ 
  children, 
  active = false, 
  className, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  // Verificar se é um botão secundário (Memorial ou Homenagem a quem partiu)
  const isMemorialButton = typeof children === 'string' && 
    (children === 'Memorial' || children === 'Homenagem a quem partiu');
  
  // Verificar se é um botão secundário de ocasião (baseado na classe text-left)
  const isOccasionSecondaryButton = className?.includes('text-left');
  
  // Determinar se deve usar o estilo gold sólido
  const shouldUseGoldSolid = isMemorialButton || isOccasionSecondaryButton;
  
  return (
    <button
      {...props}
      className={cn(
        "px-4 py-2.5 rounded-xl",
        "backdrop-blur-md border",
        "text-sm font-medium",
        "transition-all duration-500 ease-out",
        "shadow-lg shadow-black/5",
        "hover:shadow-xl hover:shadow-black/10",
        "hover:scale-[1.02]",
        "active:scale-[0.98]",
        active ? [
          // Aplicar estilo gold sólido para botões secundários
          shouldUseGoldSolid ? [
            "liquid-glass-button--gold-solid",
            "!px-4 !py-2.5 !rounded-xl", // Override dos estilos
            "shadow-xl shadow-black/20"
          ] : [
            // Aplicar o mesmo estilo do botão 'Crie sua Música' da navbar para outros botões
            "liquid-glass-button bg-transparent text-white",
            "!px-4 !py-2.5 !rounded-xl", // Override dos estilos do liquid-glass-button
            "shadow-xl shadow-black/20 glow-effect"
          ]
        ] : [
          "bg-white/10 border-white/20",
          "text-white/80 hover:text-white",
          "hover:bg-white/15 hover:border-white/30 hover:shadow-white/10"
        ],
        className
      )}
    >
      {children}
    </button>
  );
}

// Seção com título glassmorphism
export function GlassSection({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold font-heading text-white/95 drop-shadow-sm">
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

export default HeroCard;