import React, { useState, useEffect } from 'react';

import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/hooks/useTranslation';

interface CountdownTimerProps {
  onComplete?: () => void;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  onComplete, 
  className = '' 
}) => {
  const [timeLeft, setTimeLeft] = useState(300000); // 5 minutos em milissegundos
  const { t } = useTranslation('criar');

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          onComplete?.();
          return 0;
        }
        return prev - 100;
      });
    }, 100); // Atualiza a cada 100ms

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  // Formatar tempo no formato MM:SS:MS
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10); // Centésimos de segundo
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  return (
    <LiquidGlassCard
      size="md"
      className={cn(
        'mx-auto max-w-xs flex flex-col items-center gap-3 text-center py-6 px-8 backdrop-blur-2xl',
        'before:bg-gradient-to-b before:from-white/0 before:via-white/10 before:to-white/0',
        className,
      )}
    >
      <span className="text-[10px] uppercase tracking-[0.32em] text-white/60">
        {t('countdown.heading')}
      </span>
      <div className="relative">
        <div className="absolute inset-0 blur-3xl bg-secondary/25" aria-hidden />
        <div className="relative text-3xl md:text-4xl font-mono font-bold text-secondary drop-shadow-[0_0_18px_rgba(254,198,65,0.45)]">
          {formatTime(timeLeft)}
        </div>
      </div>
      <p className="text-xs text-white/70 max-w-[14rem]">
        {t('countdown.message')}
      </p>
    </LiquidGlassCard>
  );
};

export default CountdownTimer;
