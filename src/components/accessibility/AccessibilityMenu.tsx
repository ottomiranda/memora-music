import React, { useState } from 'react';
import { User, Type, Zap, X, Settings, Accessibility } from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';
import { useTranslation } from '@/i18n/hooks/useTranslation';

interface AccessibilityMenuProps {
  className?: string;
  variant?: 'floating' | 'footer';
}

export const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({ className = '', variant = 'floating' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isHighContrast,
    isReducedMotion,
    fontSize,
    toggleHighContrast,
    setFontSize,
    announceToScreenReader,
  } = useAccessibility();
  const { t } = useTranslation('accessibility');

  const handleToggleMenu = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    announceToScreenReader(
      newState 
        ? t('menu.opened') 
        : t('menu.closed')
    );
  };

  const handleHighContrastToggle = () => {
    toggleHighContrast();
    announceToScreenReader(
      isHighContrast 
        ? t('highContrast.disabled') 
        : t('highContrast.enabled')
    );
  };

  const handleFontSizeChange = (size: 'normal' | 'large' | 'extra-large') => {
    setFontSize(size);
    announceToScreenReader(t('fontSize.changed', { size: t(`fontSize.sizes.${size}`) }));
  };

  return (
    <div className={`${variant === 'floating' ? 'fixed bottom-4 right-4 z-50' : 'relative'} ${className}`}>
      {/* Botão de toggle */}
      <button
        onClick={handleToggleMenu}
        className={`${
          variant === 'footer' 
            ? 'bg-white/10 hover:bg-white/20 text-white p-2 xs:p-2 rounded-full transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center'
            : 'bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200'
        } focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`}
        aria-label={t('menu.open')}
        aria-expanded={isOpen}
        aria-controls="accessibility-menu"
      >
        {isOpen ? (
          <X className={`${variant === 'footer' ? 'w-4 xs:w-5 h-4 xs:h-5' : 'w-6 h-6'}`} aria-hidden="true" />
        ) : (
          <User className={`${variant === 'footer' ? 'w-4 xs:w-5 h-4 xs:h-5' : 'w-6 h-6'}`} aria-hidden="true" />
        )}
      </button>

      {/* Menu */}
      {isOpen && (
        <div
          id="accessibility-menu"
          className={`absolute ${
            variant === 'footer' 
              ? 'bottom-full mb-2 left-0 xs:right-0 xs:left-auto' 
              : 'bottom-16 right-0'
          } overflow-hidden backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-300 ease-out bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-xl p-4 w-80 max-w-[calc(100vw-2rem)] z-50 before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500`}
          style={{
            boxShadow: '0 8px 32px rgba(31,38,135,0.37), inset 0 1px 0 rgba(255,255,255,0.3)'
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="accessibility-menu-title"
        >
          {/* Título */}
          <h2 
            id="accessibility-menu-title"
            className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"
          >
            <User className="w-5 h-5" aria-hidden="true" />
            {t('menu.title')}
          </h2>

          {/* Alto Contraste */}
          <div className="mb-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Accessibility className="w-4 h-4" aria-hidden="true" />
                {t('highContrast.label')}
              </span>
              <button
                onClick={handleHighContrastToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  isHighContrast ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={isHighContrast}
                aria-label={t('highContrast.toggle')}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isHighContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Tamanho da Fonte */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              <span className="flex items-center gap-2">
                <Type className="w-4 h-4" aria-hidden="true" />
                {t('fontSize.label')}
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'normal', label: t('fontSize.normal') },
                { value: 'large', label: t('fontSize.large') },
                { value: 'extra-large', label: t('fontSize.extraLarge') },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleFontSizeChange(value as 'normal' | 'large' | 'extra-large')}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                    fontSize === value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                  aria-pressed={fontSize === value}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Informações sobre Movimento Reduzido */}
          {isReducedMotion && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Zap className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm font-medium">
                  {t('reducedMotion.title')}
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {t('reducedMotion.description')}
              </p>
            </div>
          )}

          {/* Atalhos de Teclado */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              {t('shortcuts.title')}
            </h3>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>{t('shortcuts.closeModals')}</span>
                <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd>
              </div>
              <div className="flex justify-between">
                <span>{t('shortcuts.navigate')}</span>
                <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Tab</kbd>
              </div>
              <div className="flex justify-between">
                <span>{t('shortcuts.skipToContent')}</span>
                <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Tab</kbd>
              </div>
            </div>
          </div>

          {/* Botão de Fechar */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleToggleMenu}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              {t('menu.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityMenu;