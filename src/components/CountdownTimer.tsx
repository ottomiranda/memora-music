import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  onComplete?: () => void;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  onComplete, 
  className = '' 
}) => {
  const [timeLeft, setTimeLeft] = useState(300000); // 5 minutos em milissegundos

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
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-16 h-16 bg-accent-turquoise/20 rounded-full flex items-center justify-center mx-auto">
        <Clock className="w-8 h-8 text-accent-turquoise" />
      </div>
      <div className="ml-4">
        <div className="text-2xl font-mono font-bold text-accent-turquoise">
          {formatTime(timeLeft)}
        </div>
        <div className="text-sm text-muted-foreground">
          Tempo estimado restante
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;