import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { songsApi } from '../config/api';
import { SongCard } from '../components/SongCard';
import { useMusicStore } from '../store/musicStore';
import { useAuthStore } from '../store/authStore';
import { Loader2, Music } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  lyrics?: string;
  audioUrl?: string;
  createdAt: string;
  userId?: string;
  guestId?: string;
}

const MinhasMusicas: React.FC = () => {
  const navigate = useNavigate();
  const { reset, startNewCreationFlow } = useMusicStore();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleCreateFirstSong = async () => {
    const { token } = useAuthStore.getState();
    await startNewCreationFlow(navigate, token);
  };

  useEffect(() => {
    const loadSongs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await songsApi.list();
        setSongs(response as Song[]);
      } catch (err) {
        console.error('Erro ao carregar músicas:', err);
        setError('Erro ao carregar suas músicas. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadSongs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Carregando suas músicas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 max-w-md">
            <p className="text-red-200 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Music className="h-10 w-10" />
            Minhas Músicas
          </h1>
          <p className="text-blue-200 text-lg">
            Suas criações musicais personalizadas
          </p>
        </div>

        {songs.length === 0 ? (
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 max-w-md mx-auto">
              <Music className="h-16 w-16 text-white/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhuma música encontrada
              </h3>
              <p className="text-blue-200 mb-4">
                Você ainda não criou nenhuma música. Que tal começar agora?
              </p>
              <button
                onClick={handleCreateFirstSong}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
              >
                Criar Primeira Música
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {songs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MinhasMusicas;