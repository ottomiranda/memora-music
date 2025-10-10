import React, { useRef, useEffect, useState } from 'react';
import { Download, Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { PurpleFormButton } from '@/components/ui/PurpleFormButton';
import { useMusicStore } from '@/store/musicStore';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { forceDownload } from '@/utils/download';
import { buildMp3Filename } from '@/utils/filename';
import { API_BASE_URL } from '@/config/api';
import { AudioClip } from '@/store/musicStore';

interface NewMusicPlayerProps {
  clips: AudioClip[];
}

const NewMusicPlayer: React.FC<NewMusicPlayerProps> = ({ clips }) => {
  const { t } = useTranslation('criar');

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
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const volumePercent = volume * 100;

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
        const baseFilename = clip.title || 'Musica_Personalizada';
        const friendlyFilename = buildMp3Filename(baseFilename);
        const proxyUrl = `${API_BASE_URL}/api/download?url=${encodeURIComponent(clip.audio_url)}&filename=${encodeURIComponent(friendlyFilename)}`;
        forceDownload(proxyUrl, friendlyFilename);
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
      <LiquidGlassCard className="p-8 text-center space-y-2">
        <div className="flex items-center justify-center gap-3 text-memora-primary">
          <div className="h-5 w-5 rounded-full border-2 border-memora-primary/40 border-t-transparent animate-spin"></div>
          <span className="text-sm font-medium text-[#FFD700]">{t('generation.waitingTracks')}</span>
        </div>
        <p className="text-sm text-white/70">{t('generation.tracksWillAppear')}</p>
      </LiquidGlassCard>
    );
  }

  return (
    <LiquidGlassCard className="p-0 overflow-hidden">
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
      <div className="p-6 space-y-6">
        {/* Track Info */}
        <div className="text-center space-y-1">
          <h3 className="text-xl font-semibold text-white">
            {currentClip?.title || t('generation.option', { number: currentTrackIndex + 1 })}
          </h3>
          <p className="text-white/60 text-sm">
            {t('generation.trackPosition', { current: currentTrackIndex + 1, total: validClips.length })}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            ref={progressRef}
            type="range"
            min="0"
            max="100"
            value={progressPercent}
            onChange={handleProgressChange}
            className="slider w-full h-2 rounded-full backdrop-blur-sm appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, rgba(90, 45, 176, 0.9) ${progressPercent}%, rgba(255,255,255,0.12) ${progressPercent}%)`
            }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={prevTrack}
            disabled={validClips.length <= 1}
            className="p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button
            onClick={togglePlayPause}
            disabled={!currentClip?.audio_url || isBuffering}
            className="p-4 rounded-full bg-memora-secondary text-memora-black hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-transform duration-200"
          >
            {isBuffering ? (
              <div className="h-6 w-6 rounded-full border-2 border-memora-primary/40 border-t-transparent animate-spin"></div>
            ) : isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>
          
          <button
            onClick={nextTrack}
            disabled={validClips.length <= 1}
            className="p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Volume2 className="w-4 h-4 text-white/60" />
          <input
            ref={volumeRef}
            type="range"
            min="0"
            max="100"
            value={volumePercent}
            onChange={handleVolumeChange}
            className="slider flex-1 h-2 rounded-full backdrop-blur-sm appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, rgba(90, 45, 176, 0.9) ${volumePercent}%, rgba(255,255,255,0.12) ${volumePercent}%)`
            }}
          />
        </div>

        {/* Track Selection */}
        {validClips.length > 1 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white/70">{t('generation.chooseOption')}</h4>
            <div className="grid grid-cols-2 gap-2">
              {validClips.map((clip, index) => (
                <button
                  key={clip.id || index}
                  onClick={() => selectTrack(index)}
                  className={`group relative overflow-hidden p-3 rounded-xl border text-left transition-all backdrop-blur-xl ${
                    index === currentTrackIndex
                      ? 'border-memora-primary/60 bg-gradient-to-br from-memora-primary/30 via-memora-primary/15 to-transparent text-white shadow-[0_10px_30px_rgba(90,45,176,0.45)]'
                      : 'border-memora-primary/30 bg-memora-primary/8 text-white/80 hover:bg-memora-primary/12'
                  }`}
                >
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/12 via-transparent to-white/12 opacity-0 transition-opacity duration-500 group-hover:opacity-60" />
                  <div className="relative z-10 font-medium text-sm">
                    {t('generation.option', { number: index + 1 })}
                  </div>
                  <div className="relative z-10 text-xs opacity-75">
                    {clip.title || t('generation.defaultTrackTitle')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Download Button */}
        {(isMvpFlowComplete || isLoggedIn) && currentClip && (
          <PurpleFormButton
            onClick={() => handleDownloadClick(currentClip)}
            className="w-full flex items-center justify-center gap-2 h-12"
          >
            <Download className="w-4 h-4" />
            {t('generation.downloadOption', { number: currentTrackIndex + 1 })}
          </PurpleFormButton>
        )}

        {/* MVP Flow Message */}
        {!isMvpFlowComplete && !isLoggedIn && (
          <div className="text-center text-white/60 text-sm italic">
            {t('generation.listenToUnlock')}
          </div>
        )}
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #5A2DB0;
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.25);
          margin-top: -4px;
        }
        .slider::-webkit-slider-runnable-track {
          height: 8px;
          border-radius: 9999px;
          background: transparent;
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #5A2DB0;
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.25);
          transform: translateY(-4px);
        }
        .slider::-moz-range-track {
          height: 8px;
          border-radius: 9999px;
          background: transparent;
        }
      `}</style>
    </LiquidGlassCard>
  );
};

export default NewMusicPlayer;
