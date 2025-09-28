import React, { useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { useMusicStore } from '@/store/musicStore';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { triggerDownload, ensureMp3Extension } from '@/utils/download';
import { API_BASE_URL } from '@/config/api';
import { AudioClip } from '@/store/musicStore';

interface MusicPreviewProps {
  clip: AudioClip;
  index: number;
}

const MusicPreview: React.FC<MusicPreviewProps> = ({ clip, index }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeOutIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { isMvpFlowComplete, setValidationPopupVisible } = useMusicStore();
  const { isLoggedIn } = useAuthStore();
  const { showAuthPopup } = useUiStore();

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    // Usuários logados não sofrem gating de 45s
    if (!audio || isMvpFlowComplete || isLoggedIn) return;

    const currentTime = audio.currentTime;

    // Inicia o fade-out aos 40 segundos
    if (currentTime >= 40 && !fadeOutIntervalRef.current) {
      console.log('[MVP] Iniciando fade-out aos 40s');
      
      fadeOutIntervalRef.current = setInterval(() => {
        if (audio.volume > 0.1) {
          audio.volume = Math.max(0, audio.volume - 0.1);
        } else {
          audio.volume = 0;
        }
      }, 500); // Reduz o volume a cada 500ms por 5 segundos
    }
    
    // Pausa a música aos 45 segundos e exibe o popup
    if (currentTime >= 45) {
      console.log('[MVP] Pausando música aos 45s e exibindo popup');
      
      audio.pause();
      
      // Limpa o intervalo de fade-out
      if (fadeOutIntervalRef.current) {
        clearInterval(fadeOutIntervalRef.current);
        fadeOutIntervalRef.current = null;
      }
      
      // Exibe o popup de validação somente para convidados (não logados)
      if (!isLoggedIn) {
        setValidationPopupVisible(true);
      }
    }
  };

  // Limpeza ao desmontar o componente
  useEffect(() => {
    return () => {
      if (fadeOutIntervalRef.current) {
        clearInterval(fadeOutIntervalRef.current);
        fadeOutIntervalRef.current = null;
      }
    };
  }, []);

  // Reset do volume quando o MVP flow for completado
  useEffect(() => {
    if (isMvpFlowComplete && audioRef.current) {
      audioRef.current.volume = 1.0;
      
      // Limpa qualquer fade-out em andamento
      if (fadeOutIntervalRef.current) {
        clearInterval(fadeOutIntervalRef.current);
        fadeOutIntervalRef.current = null;
      }
    }
  }, [isMvpFlowComplete]);

  const getFileName = () => {
    const baseName = clip.title || `Musica_Personalizada_${index + 1}`;
    return ensureMp3Extension(baseName);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const startDownload = () => {
      if (clip.audio_url) {
        console.log(`[DOWNLOAD] Iniciando download via proxy para: ${clip.audio_url}`);
        const friendlyFilename = getFileName();
        
        // Constrói a URL do nosso próprio backend para proxy
        const proxyUrl = `${API_BASE_URL}/api/download?url=${encodeURIComponent(clip.audio_url)}&filename=${encodeURIComponent(friendlyFilename)}`;
        
        // Chama a função de download com a nossa URL de proxy
        triggerDownload(proxyUrl, friendlyFilename);
      }
    };

    if (isLoggedIn) {
      startDownload();
    } else {
      showAuthPopup(startDownload);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading font-semibold text-gray-800">
          Opção {index + 1}
        </h3>
        {clip.status === 'complete' && (
          <span className="text-sm text-green-600 font-medium">
            ✓ Completa
          </span>
        )}
        {clip.status === 'processing' && (
          <span className="text-sm text-blue-600 font-medium">
            ⏳ Processando...
          </span>
        )}
      </div>

      {clip.audio_url ? (
        <div className="space-y-4">
          <audio
            ref={audioRef}
            controls
            className="w-full"
            src={clip.audio_url}
            onTimeUpdate={handleTimeUpdate}
            preload="metadata"
          >
            Seu navegador não suporta o elemento de áudio.
          </audio>

          {/* Botão de download
              - Convidado: após completar MVP flow
              - Logado: sempre visível */}
          {(isMvpFlowComplete || isLoggedIn) && (
            <button
              onClick={handleDownloadClick}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
            >
              <Download className="w-4 h-4" />
              Baixar Opção
            </button>
          )}

          {/* Mensagem quando MVP flow não está completo (somente convidados) */}
          {!isMvpFlowComplete && !isLoggedIn && (
            <div className="text-sm text-gray-500 italic">
              Ouça a prévia completa para desbloquear o download
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-20 bg-gray-50 rounded-lg">
          <div className="text-gray-500">
            {clip.status === 'processing' ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Gerando música...
              </div>
            ) : (
              'Aguardando processamento...'
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPreview;
