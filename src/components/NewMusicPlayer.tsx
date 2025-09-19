import React, { useRef, useEffect, useState } from 'react';
import { Download, Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useMusicStore } from '@/store/musicStore';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { triggerDownload } from '@/utils/download';
import { API_BASE_URL } from '@/config/api';
import { AudioClip } from '@/store/musicStore';

interface NewMusicPlayerProps {
  clips: AudioClip[];
}

const NewMusicPlayer: React.FC<NewMusicPlayerProps> = ({ clips }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeOutIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<HTMLInputElement>(null);
  const volumeRef = useRef<HTMLInputElement>(null);
  
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  
  const { isMvpFlowComplete, setValidationPopupVisible } = useMusicStore();
  const { isLoggedIn } = useAuthStore();
  const { showAuthPopup } = useUiStore();

  const currentClip = clips[currentTrackIndex];

  // Função para lidar com o gating de 45s para usuários não logados
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
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
      }, 500);
    }
    
    // Pausa a música aos 45 segundos e exibe o popup
    if (currentTime >= 45) {
      console.log('[MVP] Pausando música aos 45s e exibindo popup');
      
      audio.pause();
      setIsPlaying(false);
      
      if (fadeOutIntervalRef.current) {
        clearInterval(fadeOutIntervalRef.current);
        fadeOutIntervalRef.current = null;
      }
      
      if (!isLoggedIn) {
        setValidationPopupVisible(true);
      }
    }
  };

  // Atualiza o tempo atual
  const updateCurrentTime = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    }
  };

  // Controla o buffering
  const handleWaiting = () => setIsBuffering(true);
  const handleCanPlay = () => setIsBuffering(false);

  // Play/Pause
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !currentClip?.audio_url) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  // Navegar entre faixas
  const selectTrack = (index: number) => {
    if (index >= 0 && index < clips.length && clips[index]?.audio_url) {
      setCurrentTrackIndex(index);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const nextTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % clips.length;
    selectTrack(nextIndex);
  };

  const prevTrack = () => {
    const prevIndex = currentTrackIndex === 0 ? clips.length - 1 : currentTrackIndex - 1;
    selectTrack(prevIndex);
  };

  // Controle de progresso
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (audio) {
      const newTime = (parseFloat(e.target.value) / 100) * duration;
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Controle de volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Formatar tempo
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Download
  const handleDownloadClick = (clip: AudioClip) => {
    const startDownload = () => {
      if (clip.audio_url) {
        const friendlyFilename = clip.title || `Musica_Personalizada.mp3`;
        const proxyUrl = `${API_BASE_URL}/api/download?url=${encodeURIComponent(clip.audio_url)}&filename=${encodeURIComponent(friendlyFilename)}`;
        triggerDownload(proxyUrl, friendlyFilename);
      }
    };

    if (isLoggedIn) {
      startDownload();
    } else {
      showAuthPopup(startDownload);
    }
  };

  // Reset do volume quando o MVP flow for completado
  useEffect(() => {
    if (isMvpFlowComplete && audioRef.current) {
      audioRef.current.volume = volume;
      
      if (fadeOutIntervalRef.current) {
        clearInterval(fadeOutIntervalRef.current);
        fadeOutIntervalRef.current = null;
      }
    }
  }, [isMvpFlowComplete, volume]);

  // Limpeza
  useEffect(() => {
    return () => {
      if (fadeOutIntervalRef.current) {
        clearInterval(fadeOutIntervalRef.current);
        fadeOutIntervalRef.current = null;
      }
    };
  }, []);

  // Filtrar apenas clips com audio_url
  const validClips = clips.filter(clip => clip.audio_url);
  
  if (validClips.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 text-center">
        <div className="text-slate-400">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            Aguardando músicas...
          </div>
          <p className="text-sm">Suas músicas aparecerão aqui quando estiverem prontas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Audio element */}
      <audio
        ref={audioRef}
        src={currentClip?.audio_url}
        onTimeUpdate={() => {
          updateCurrentTime();
          handleTimeUpdate();
        }}
        onLoadedMetadata={updateCurrentTime}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onEnded={nextTrack}
        preload="metadata"
      />

      {/* Player Interface */}
      <div className="p-6">
        {/* Track Info */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-1">
            {currentClip?.title || `Opção ${currentTrackIndex + 1}`}
          </h3>
          <p className="text-slate-400 text-sm">
            Faixa {currentTrackIndex + 1} de {validClips.length}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            ref={progressRef}
            type="range"
            min="0"
            max="100"
            value={duration ? (currentTime / duration) * 100 : 0}
            onChange={handleProgressChange}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={prevTrack}
            disabled={validClips.length <= 1}
            className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button
            onClick={togglePlayPause}
            disabled={!currentClip?.audio_url || isBuffering}
            className="p-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isBuffering ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>
          
          <button
            onClick={nextTrack}
            disabled={validClips.length <= 1}
            className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3 mb-6">
          <Volume2 className="w-4 h-4 text-slate-400" />
          <input
            ref={volumeRef}
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={handleVolumeChange}
            className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Track Selection */}
        {validClips.length > 1 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Escolha uma opção:</h4>
            <div className="grid grid-cols-2 gap-2">
              {validClips.map((clip, index) => (
                <button
                  key={clip.id || index}
                  onClick={() => selectTrack(index)}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    index === currentTrackIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  <div className="font-medium text-sm">
                    Opção {index + 1}
                  </div>
                  <div className="text-xs opacity-75">
                    {clip.title || 'Música personalizada'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Download Button */}
        {(isMvpFlowComplete || isLoggedIn) && currentClip && (
          <button
            onClick={() => handleDownloadClick(currentClip)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Baixar Opção {currentTrackIndex + 1}
          </button>
        )}

        {/* MVP Flow Message */}
        {!isMvpFlowComplete && !isLoggedIn && (
          <div className="text-center text-slate-400 text-sm italic mt-4">
            Ouça a prévia completa para desbloquear o download
          </div>
        )}
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e293b;
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e293b;
        }
      `}</style>
    </div>
  );
};

export default NewMusicPlayer;