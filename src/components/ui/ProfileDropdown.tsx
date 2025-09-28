import React from 'react';
import { User, Settings, LogOut } from 'lucide-react';
import Avatar from './avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/hooks/useTranslation';

interface ProfileDropdownProps {
  userName: string;
  userEmail?: string;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
  className?: string;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  userName,
  userEmail,
  onProfileClick,
  onSettingsClick,
  onLogoutClick,
  className = '',
}) => {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "relative focus:outline-none focus:ring-2 focus:ring-white/20 rounded-full",
            "transition-all duration-300 hover:scale-105",
            "touch-manipulation", // Otimização para touch em mobile
            "min-h-[44px] min-w-[44px]", // Área mínima de toque (44px é o padrão de acessibilidade)
            className
          )}
          aria-label="Menu do perfil"
        >
          <Avatar
            name={userName}
            size="md" // Será responsivo via CSS
            className={cn(
              "cursor-pointer transition-all duration-300",
              "hover:shadow-lg hover:shadow-white/10",
              // Tamanhos responsivos do avatar
              "w-8 h-8 text-sm sm:w-9 sm:h-9 sm:text-sm md:w-10 md:h-10 md:text-base"
            )}
          />
          {/* Indicador de status online - responsivo */}
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 bg-green-400 border-2 border-white/20 rounded-full animate-pulse",
            "w-2.5 h-2.5 sm:w-3 sm:h-3" // Tamanho responsivo do indicador
          )} />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        className={cn(
          // Largura responsiva
          "w-72 sm:w-64 md:w-72 lg:w-80",
          // Padding responsivo
          "p-3 sm:p-2 md:p-3",
          // Margem responsiva
          "mr-2 sm:mr-4",
          // Estilo liquidglass
          "bg-white/10 backdrop-blur-xl border border-white/20",
          "shadow-2xl shadow-black/20",
          "rounded-2xl",
          // Animações otimizadas
          "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
          "duration-200",
          // Otimizações para mobile
          "max-h-[80vh] overflow-y-auto", // Previne overflow em telas pequenas
          "will-change-transform" // Otimização de performance
        )}
        align="end"
        sideOffset={8}
        alignOffset={-8} // Ajuste para melhor posicionamento em mobile
        avoidCollisions={true} // Evita colisões com bordas da tela
        collisionPadding={16} // Padding para evitar colisões
      >
        {/* Header do usuário */}
        <DropdownMenuLabel className={cn(
          "px-3 py-3 sm:px-3 sm:py-2.5 md:px-3 md:py-3", // Padding responsivo
          "border-b border-white/10"
        )}>
          <div className="flex items-center space-x-3">
            <Avatar 
              name={userName} 
              size="sm" 
              className={cn(
                "flex-shrink-0",
                // Tamanho responsivo do avatar no header
                "w-8 h-8 text-sm sm:w-7 sm:h-7 sm:text-xs md:w-8 md:h-8 md:text-sm"
              )} 
            />
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-semibold text-white truncate",
                "text-sm sm:text-sm md:text-sm" // Tamanho de texto responsivo
              )}>
                {userName}
              </p>
              {userEmail && (
                <p className={cn(
                  "text-white/70 truncate",
                  "text-xs sm:text-xs md:text-xs" // Tamanho de texto responsivo
                )}>
                  {userEmail}
                </p>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        {/* Opções do menu */}
        <div className={cn(
          "py-2 sm:py-1.5 md:py-2" // Padding responsivo
        )}>
          <DropdownMenuItem
            onClick={onProfileClick}
            className={cn(
              "flex items-center rounded-xl",
              "px-3 py-3 sm:py-2.5 md:py-3", // Padding responsivo - maior área de toque em mobile
              "mx-1 sm:mx-1 md:mx-1",
              "text-white/90 hover:text-white",
              "hover:bg-white/10 focus:bg-white/10",
              "transition-all duration-200",
              "cursor-pointer group",
              "touch-manipulation", // Otimização para touch
              "min-h-[44px]" // Altura mínima para acessibilidade
            )}
          >
            <User className={cn(
              "mr-3 text-white/70 group-hover:text-white transition-colors",
              "w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" // Ícone responsivo
            )} />
            <span className={cn(
              "font-medium",
              "text-sm sm:text-sm md:text-base" // Texto responsivo
            )}>{t('navigation.profile')}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={onSettingsClick}
            className={cn(
              "flex items-center rounded-xl",
              "px-3 py-3 sm:py-2.5 md:py-3", // Padding responsivo - maior área de toque em mobile
              "mx-1 sm:mx-1 md:mx-1",
              "text-white/90 hover:text-white",
              "hover:bg-white/10 focus:bg-white/10",
              "transition-all duration-200",
              "cursor-pointer group",
              "touch-manipulation", // Otimização para touch
              "min-h-[44px]" // Altura mínima para acessibilidade
            )}
          >
            <Settings className={cn(
              "mr-3 text-white/70 group-hover:text-white transition-colors",
              "w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" // Ícone responsivo
            )} />
            <span className={cn(
              "font-medium",
              "text-sm sm:text-sm md:text-base" // Texto responsivo
            )}>{t('navigation.settings')}</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-2 bg-white/10" />

        {/* Opção de logout */}
        <div className="py-1">
          <DropdownMenuItem
            onClick={onLogoutClick}
            className="
              flex items-center px-3 py-2.5 mx-1 rounded-xl
              text-red-300 hover:text-red-200
              hover:bg-red-500/10 focus:bg-red-500/10
              transition-all duration-200
              cursor-pointer group
            "
          >
            <LogOut className="w-4 h-4 mr-3 text-red-400 group-hover:text-red-300 transition-colors" />
            <span className="text-sm font-medium">{t('navigation.logout')}</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;