import React from 'react';
import { Play, Pause, Music, Clock, User } from 'lucide-react';
import { Song } from '../types/guest';

interface SongCardProps {
  song: Song;
  isPlaying?: boolean;
  onPlay?: (song: Song) => void;
  onPause?: () => void;
  className?: string;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  isPlaying = false,
  onPlay,
  onPause,
  className = ''
}) => {
  const handlePlayPause = () => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.(song);
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
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 ${className}`}>
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
          className="flex-shrink-0 ml-3 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors duration-200"
          aria-label={isPlaying ? 'Pausar música' : 'Reproduzir música'}
        >
          {isPlaying ? (
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

      {/* Indicador visual quando está tocando */}
      {isPlaying && (
        <div className="mt-3">
          <div className="flex items-center space-x-1">
            <div className="w-1 h-4 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-1 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-5 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            <span className="text-xs text-blue-600 font-medium ml-2">Reproduzindo...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongCard;