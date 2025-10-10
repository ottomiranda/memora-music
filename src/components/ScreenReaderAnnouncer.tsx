import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const ScreenReaderAnnouncer: React.FC = () => {
  const [announcement, setAnnouncement] = useState('');
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    // Anuncia mudança de rota para leitores de tela
    const pageTitle = document.title || location.pathname;
    setAnnouncement(t('accessibility.pageChanged', { page: pageTitle }));
  }, [location, t]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};