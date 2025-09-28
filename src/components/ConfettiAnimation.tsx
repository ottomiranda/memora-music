import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

interface ConfettiAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({ show, onComplete }) => {
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 6500); // 6.5 segundos de duração para explosão épica

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <Confetti
        width={windowDimensions.width}
        height={windowDimensions.height}
        numberOfPieces={1400} // Explosão épica com muito mais partículas
        recycle={false}
        gravity={0.1} // Gravidade ainda menor para máximo tempo no ar
        colors={[
          '#7c3aed', '#8b5cf6', '#a855f7', '#c084fc', // violetas
          '#f59e0b', '#fbbf24', '#f97316', '#fb923c', // laranjas/âmbares
          '#ef4444', '#f87171', '#dc2626', '#b91c1c', // vermelhos
          '#ec4899', '#f472b6', '#be185d', '#9d174d', // rosas
          '#10b981', '#34d399', '#059669', '#047857', // verdes
          '#06b6d4', '#22d3ee', '#0891b2', '#0e7490', // cianos
          '#3b82f6', '#60a5fa', '#2563eb', '#1d4ed8', // azuis
          '#6366f1', '#818cf8', '#4f46e5', '#3730a3', // índigos
          '#84cc16', '#a3e635', '#65a30d', '#4d7c0f', // limas
          '#eab308', '#facc15', '#ca8a04', '#a16207', // amarelos
          '#d946ef', '#e879f9', '#c026d3', '#a21caf', // fúcsias
          '#ff1744', '#00e676', '#2196f3', '#ff9800', // cores extras vibrantes
          '#e91e63', '#9c27b0', '#00bcd4', '#8bc34a', // mais cores intensas
        ]}
        initialVelocityX={15} // Dispersão horizontal extrema
        initialVelocityY={55} // Explosão vertical violenta
        wind={0.05} // Vento mais forte para movimento caótico
        friction={0.98} // Menos fricção para movimento mais duradouro
        opacity={0.9} // Mais opaco para maior impacto visual
        spread={360} // Cobertura total em todas as direções
        scalar={1.2} // Partículas maiores e mais visíveis
        origin={{
          x: Math.random() * 0.8 + 0.1, // Origem aleatória horizontal
          y: Math.random() * 0.3 // Origem aleatória na parte superior
        }}
      />
    </div>
  );
};

export default ConfettiAnimation;
