import React from 'react';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import type { SupportedLanguages } from '@/types/i18next';

interface Language {
  code: SupportedLanguages;
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

/**
 * LanguageSelector - Componente para seleção de idioma
 * Permite alternar entre português e inglês
 */
const LanguageSelector: React.FC = () => {
  const { getCurrentLanguage, changeLanguage, t } = useTranslation('common');
  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = async (languageCode: SupportedLanguages) => {
    try {
      await changeLanguage(languageCode);
    } catch (error) {
      console.error('Erro ao alterar idioma:', error);
    }
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Globe className="h-4 w-4 mr-2" />
          <span className="mr-1">{currentLang.flag}</span>
          <span className="hidden sm:inline">{currentLang.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`cursor-pointer ${
              currentLanguage === language.code
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-muted'
            }`}
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;