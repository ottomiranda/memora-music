import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiRequest, API_BASE_URL } from '../config/api';
import { Music, Play, Pause, Download, Calendar, Clock } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  mood: string;
  tempo: string;
  duration: number;
  audioUrl: string;
  createdAt: string;
  userId?: string;
  guestId?: string;
}

interface SongsResponse {
  songs: Song[];
  total: number;
}

const MinhasMusicas: React.FC = () => {
  const { isLoggedIn, user } = useAuthStore();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchSongs();
  }, [isLoggedIn]);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest(`${API_BASE_URL}/api/songs`);
      const data: SongsResponse = await response.json();
      
      setSongs(data.songs);
    } catch (err) {
      console.error('Erro ao carregar músicas:', err);
      setError('Erro ao carregar suas músicas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = (song: Song) => {
    if (currentlyPlaying === song.id) {
      // Pausar música atual
      if (audioElement) {
        audioElement.pause();
        setCurrentlyPlaying(null);
      }
    } else {
      // Parar música anterior se houver
      if (audioElement) {
        audioElement.pause();
      }
      
      // Tocar nova música
      const audio = new Audio(song.audioUrl);
      audio.play();
      setAudioElement(audio);
      setCurrentlyPlaying(song.id);
      
      // Limpar quando a música terminar
      audio.onended = () => {
        setCurrentlyPlaying(null);
        setAudioElement(null);
      };
    }
  };

  const handleDownload = (song: Song) => {
    const link = document.createElement('a');
    link.href = song.audioUrl;
    link.download = `${song.title} - ${song.artist}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando suas músicas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Music className="h-10 w-10" />
            Minhas Músicas
          </h1>
          <p className="text-blue-200 text-lg">
            {isLoggedIn && user 
              ? `Bem-vindo, ${user.name || user.email}!` 
              : 'Suas músicas como visitante'}
          </p>
          {!isLoggedIn && (
            <p className="text-yellow-300 text-sm mt-2">
              💡 Faça login para salvar suas músicas permanentemente
            </p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
            <button 
              onClick={fetchSongs}
              className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Songs List */}
        {songs.length === 0 ? (
          <div className="text-center py-12">
            <Music className="h-16 w-16 text-blue-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhuma música encontrada</h3>
            <p className="text-blue-200 mb-6">
              Você ainda não criou nenhuma música. Que tal começar agora?
            </p>
            <a 
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Criar Primeira Música
            </a>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {songs.map((song) => (
              <div 
                key={song.id} 
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Song Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{song.title}</h3>
                    <p className="text-blue-200 mb-2">{song.artist}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-1 bg-purple-600/30 text-purple-200 rounded-full text-xs">
                        {song.genre}
                      </span>
                      <span className="px-2 py-1 bg-blue-600/30 text-blue-200 rounded-full text-xs">
                        {song.mood}
                      </span>
                      <span className="px-2 py-1 bg-indigo-600/30 text-indigo-200 rounded-full text-xs">
                        {song.tempo}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-blue-300">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(song.duration)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(song.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePlayPause(song)}
                      className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full transition-all duration-200 transform hover:scale-105"
                      title={currentlyPlaying === song.id ? 'Pausar' : 'Reproduzir'}
                    >
                      {currentlyPlaying === song.id ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5 ml-0.5" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDownload(song)}
                      className="flex items-center justify-center w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full transition-all duration-200 transform hover:scale-105"
                      title="Download"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Stats */}
        {songs.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-blue-200">
              Total: <span className="font-semibold text-white">{songs.length}</span> música{songs.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinhasMusicas;