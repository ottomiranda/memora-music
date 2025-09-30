import React, { useEffect, useRef } from 'react';
import { useAccessibility } from './AccessibilityProvider';

interface ScreenReaderAnnouncerProps {
  className?: string;
}

export const ScreenReaderAnnouncer: React.FC<ScreenReaderAnnouncerProps> = ({ 
  className = '' 
}) => {
  const { announcements } = useAccessibility();
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const politeRegionRef = useRef<HTMLDivElement>(null);

  // Limpar anúncios antigos após um tempo
  useEffect(() => {
    if (announcements.length > 0) {
      const timer = setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
        if (politeRegionRef.current) {
          politeRegionRef.current.textContent = '';
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [announcements]);

  // Separar anúncios por prioridade
  const assertiveAnnouncements = announcements.filter(a => a.priority === 'assertive');
  const politeAnnouncements = announcements.filter(a => a.priority === 'polite');

  return (
    <div className={`sr-only ${className}`}>
      {/* Região para anúncios assertivos (interrompem o leitor de tela) */}
      <div
        ref={liveRegionRef}
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveAnnouncements.map((announcement) => (
          <div key={announcement.id}>
            {announcement.message}
          </div>
        ))}
      </div>

      {/* Região para anúncios educados (aguardam pausa no leitor de tela) */}
      <div
        ref={politeRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeAnnouncements.map((announcement) => (
          <div key={announcement.id}>
            {announcement.message}
          </div>
        ))}
      </div>

      {/* Região para status geral da aplicação */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="sr-only"
        role="status"
      >
        {/* Esta região pode ser usada para status contínuos */}
      </div>
    </div>
  );
};

// Hook para facilitar o uso de anúncios
export const useScreenReaderAnnouncer = () => {
  const { announceToScreenReader } = useAccessibility();

  const announceSuccess = (message: string) => {
    announceToScreenReader(`Sucesso: ${message}`, 'polite');
  };

  const announceError = (message: string) => {
    announceToScreenReader(`Erro: ${message}`, 'assertive');
  };

  const announceWarning = (message: string) => {
    announceToScreenReader(`Aviso: ${message}`, 'assertive');
  };

  const announceInfo = (message: string) => {
    announceToScreenReader(`Informação: ${message}`, 'polite');
  };

  const announceNavigation = (location: string) => {
    announceToScreenReader(`Navegou para ${location}`, 'polite');
  };

  const announceLoading = (action: string) => {
    announceToScreenReader(`Carregando ${action}`, 'polite');
  };

  const announceLoadingComplete = (action: string) => {
    announceToScreenReader(`${action} carregado`, 'polite');
  };

  return {
    announce: announceToScreenReader,
    announceSuccess,
    announceError,
    announceWarning,
    announceInfo,
    announceNavigation,
    announceLoading,
    announceLoadingComplete,
  };
};

export default ScreenReaderAnnouncer;