import React from 'react';
import { useTranslation } from 'react-i18next';

export const SkipToMainContent: React.FC = () => {
  const { t } = useTranslation('accessibility');
  
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {t('skipToMainContent')}
    </a>
  );
};

export const SkipToNavigation: React.FC = () => {
  const { t } = useTranslation('accessibility');
  
  return (
    <a
      href="#main-navigation"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {t('skipToNavigation')}
    </a>
  );
};