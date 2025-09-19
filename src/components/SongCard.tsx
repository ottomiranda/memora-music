import React from 'react';
import { Play, Pause, Music, Clock, User, Download } from 'lucide-react';
import { Song } from '../types/guest';
import { useAudioPlayerStore } from '@/store/audioPlayerStore';

interface SongCardProps {
  song: Song;
  isPlaying?: boolean;
  isLoading?: boolean;
  onPlay?: (song: Song, urlOverride?: string, versionLabel?: 'A' | 'B') => void;
  onPause?: () => void;
  className?: string;
  onDownloadVersion?: (label: string, url: string) => void;
  playingVersionLabel?: 'A' | 'B' | undefined;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  isPlaying = false,
  isLoading = false,
  onPlay,
  onPause,
  className = '',
  onDownloadVersion,
  playingVersionLabel,
}) => {
  const { currentTime, duration } = useAudioPlayerStore();

  const handlePlayPause = () => {
    if (isLoading) return;
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.(song, (song as any).audioUrlOption1 || song.audioUrl, 'A');
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className={`relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ${className}`}>
      {song.imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${song.imageUrl})` }}
          aria-hidden="true"
        />
      )}
      <div className="relative p-4 bg-white/90">
      {/* Header com título e botão de play */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
            {song.title}
          </h3>
          {song.artist && (
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <User className="w-4 h-4 mr-1" />
              <span className="truncate">{song.artist}</span>
            </div>
          )}
        </div>
        
        <button
          onClick={handlePlayPause}
          disabled={isLoading}
          className="flex-shrink-0 ml-3 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors duration-200"
          aria-label={isLoading ? 'Carregando música' : isPlaying ? 'Pausar música' : 'Reproduzir música'}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>
      </div>

      {/* Informações da música */}
      <div className="space-y-2">
        {song.genre && (
          <div className="flex items-center text-sm text-gray-600">
            <Music className="w-4 h-4 mr-2" />
            <span>{song.genre}</span>
          </div>
        )}
        
        {song.duration && (
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span>{formatDuration(song.duration)}</span>
          </div>
        )}

        {/* Versões geradas (A/B) */}
        {((song as any).audioUrlOption1 || (song as any).audioUrlOption2) && (
          <div className="mt-2 space-y-2">
            {(song as any).audioUrlOption1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 font-medium flex items-center gap-2">
                  Versão A
                  {isPlaying && playingVersionLabel === 'A' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">Tocando</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPlay?.(song, (song as any).audioUrlOption1, 'A')}
                    disabled={isLoading}
                    className={`px-2 py-1 text-xs rounded-md ${isPlaying && playingVersionLabel === 'A' ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    aria-label="Reproduzir versão A"
                  >
                    <Play className="w-3 h-3 inline mr-1" /> Reproduzir
                  </button>
                  {onDownloadVersion && (
                    <button
                      onClick={() => onDownloadVersion('A', (song as any).audioUrlOption1)}
                      className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"
                      aria-label="Baixar versão A"
                    >
                      <Download className="w-3 h-3 inline mr-1" /> Baixar
                    </button>
                  )}
                </div>
              </div>
            )}
            {(song as any).audioUrlOption2 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 font-medium flex items-center gap-2">
                  Versão B
                  {isPlaying && playingVersionLabel === 'B' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">Tocando</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPlay?.(song, (song as any).audioUrlOption2, 'B')}
                    disabled={isLoading}
                    className={`px-2 py-1 text-xs rounded-md ${isPlaying && playingVersionLabel === 'B' ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    aria-label="Reproduzir versão B"
                  >
                    <Play className="w-3 h-3 inline mr-1" /> Reproduzir
                  </button>
                  {onDownloadVersion && (
                    <button
                      onClick={() => onDownloadVersion('B', (song as any).audioUrlOption2)}
                      className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"
                      aria-label="Baixar versão B"
                    >
                      <Download className="w-3 h-3 inline mr-1" /> Baixar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer com data de criação */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Criada em {formatDate(song.createdAt)}</span>
          {song.status && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              song.status === 'completed' 
                ? 'bg-green-100 text-green-800'
                : song.status === 'processing'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {song.status === 'completed' ? 'Concluída' : 
               song.status === 'processing' ? 'Processando' : 
               song.status === 'failed' ? 'Falhou' : song.status}
            </span>
          )}
        </div>
      </div>

      {/* Indicador de progresso quando está tocando */}
      {isPlaying && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
            <span className="font-medium">Reproduzindo{playingVersionLabel ? ` · Versão ${playingVersionLabel}` : ''}</span>
            <span>
              {formatDuration(Math.floor(currentTime || 0))} / {formatDuration(Math.floor(duration || 0))}
            </span>
          </div>
          <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-[width] duration-200"
              style={{ width: `${Math.min(100, Math.max(0, (currentTime && duration ? (currentTime / Math.max(1, duration)) * 100 : 0)))}%` }}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default SongCard;
