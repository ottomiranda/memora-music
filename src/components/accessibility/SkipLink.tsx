import React from 'react';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ 
  href, 
  children, 
  className = '' 
}) => {
  return (
    <a
      href={href}
      className={`
        skip-link
        absolute -top-10 left-4 z-[9999]
        bg-blue-600 text-white px-4 py-2 rounded-md
        font-medium text-sm
        transform transition-transform duration-200
        focus:top-4 focus:outline-none
        focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600
        ${className}
      `}
      onFocus={(e) => {
        // Garantir que o link seja visível quando focado
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onBlur={(e) => {
        // Esconder o link quando perde o foco
        e.currentTarget.style.transform = 'translateY(-100%)';
      }}
    >
      {children}
    </a>
  );
};

// Componente específico para pular para o conteúdo principal
export const SkipToMainContent: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <SkipLink href="#main-content" className={className}>
      Pular para o conteúdo principal
    </SkipLink>
  );
};

// Componente específico para pular para a navegação
export const SkipToNavigation: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <SkipLink href="#main-navigation" className={className}>
      Pular para a navegação
    </SkipLink>
  );
};

// Componente específico para pular para o rodapé
export const SkipToFooter: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <SkipLink href="#footer" className={className}>
      Pular para o rodapé
    </SkipLink>
  );
};

export default SkipLink;