import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, songsApi } from '../config/api';
import { SongCard } from '../components/SongCard';
import { useMusicStore } from '../store/musicStore';
import { useAuthStore } from '../store/authStore';
import { Loader2, Music, Download, Share2, Edit3, Trash2, Search, Link as LinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { triggerDownload } from '@/utils/download';
import { useAudioPlayerStore } from '@/store/audioPlayerStore';
import { toast } from 'sonner';

interface Song {
  id: string;
  title: string;
  lyrics?: string;
  // URLs individuais das duas versões geradas pela Suno
  audioUrlOption1?: string;
  audioUrlOption2?: string;
  // Compat: URL "default" (primeira opção)
  audioUrl?: string;
  imageUrl?: string;
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
  const { currentId, isPlaying, play: playGlobal, pause: pauseGlobal, currentVersionLabel } = useAudioPlayerStore();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'title'>('recent');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [songPendingDelete, setSongPendingDelete] = useState<Song | null>(null);

  const handleCreateFirstSong = async () => {
    const { token } = useAuthStore.getState();
    await startNewCreationFlow(navigate, token);
  };

  useEffect(() => {
    const loadSongs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response: any = await songsApi.list();
        // Aceitar diferentes formatos: {success, data:{songs:[]}} ou array direto
        const items: any[] = response?.data?.songs || response?.songs || response || [];
        const normalized: Song[] = items.map((s: any) => {
          const option1 = s.audioUrlOption1 || s.audio_url_option1 || s.audioUrl || s.audio_url || '';
          const option2 = s.audioUrlOption2 || s.audio_url_option2 || '';
          return {
            id: s.id,
            title: s.title || 'Sem título',
            lyrics: s.lyrics || undefined,
            audioUrlOption1: option1 || undefined,
            audioUrlOption2: option2 || undefined,
            // compat: manter campo único apontando para a opção 1 por padrão
            audioUrl: option1 || option2 || undefined,
            imageUrl: s.imageUrl || s.image_url || undefined,
            createdAt: (typeof s.createdAt === 'string' ? s.createdAt : (s.created_at || new Date().toISOString())),
            userId: s.userId || s.user_id,
            guestId: s.guestId || s.guest_id,
            // status/generation
            // normalize various possible fields
            // backend uses generation_status; keep a simple string for filtering
            // fallback to 'completed' to keep existing visuals pleasant
            status: s.status || s.generationStatus || s.generation_status || 'completed',
          };
        });
        // Ordenar por mais recentes
        normalized.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSongs(normalized);
      } catch (err) {
        console.error('Erro ao carregar músicas:', err);
        setError('Erro ao carregar suas músicas. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadSongs();
  }, []);

  const getAudioUrl = (song: Song) => song.audioUrl || song.audioUrlOption1 || song.audioUrlOption2;

  const handlePlay = (song: Song, urlOverride?: string, versionLabel?: 'A' | 'B') => {
    const url = urlOverride || getAudioUrl(song);
    if (!url) return;
    playGlobal(song.id, url, { title: song.title, versionLabel });
  };

  const handlePause = () => {
    pauseGlobal();
  };

  const handleEdit = async (song: Song) => {
    try {
      // Pré-carregar dados mínimos no formulário e navegar
      const { updateFormData } = useMusicStore.getState();
      updateFormData({ songTitle: song.title, lyrics: song.lyrics || '' });
      navigate('/criar');
    } catch (e) {
      console.error('Erro ao preparar edição:', e);
    }
  };

  const handleDelete = async (song: Song) => {
    setSongPendingDelete(song);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const song = songPendingDelete;
    if (!song) return;
    try {
      await songsApi.remove(song.id);
      setSongs((prev) => prev.filter((s) => s.id !== song.id));
    } catch (e) {
      console.error('Erro ao excluir música:', e);
      alert('Não foi possível excluir a música.');
    } finally {
      setConfirmOpen(false);
      setSongPendingDelete(null);
    }
  };

  const handleShare = async (song: Song) => {
    const publicUrl = `${window.location.origin}/musica/${song.id}`;
    const url = publicUrl;
    const shareData = {
      title: song.title,
      text: 'Ouça minha música no Memora Music',
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData as any);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copiado para a área de transferência');
      }
    } catch {}
  };

  const handleDownload = async (song: Song, urlOverride?: string, filenameSuffix?: string) => {
    const url = urlOverride || getAudioUrl(song);
    if (!url) return;
    const friendly = `${song.title || 'minha-musica'}${filenameSuffix ? `_${filenameSuffix}` : ''}.mp3`;
    try {
      const proxyUrl = `${API_BASE_URL}/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(friendly)}`;
      await triggerDownload(proxyUrl, friendly);
    } catch (e) {
      console.error('Erro no download via proxy, tentando direto:', e);
      await triggerDownload(url, friendly);
    }
  };

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
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Music className="h-10 w-10" />
            Minhas Músicas
          </h1>
          <div className="flex items-center justify-center gap-4">
            <p className="text-blue-200 text-lg">Suas criações musicais personalizadas</p>
            <button
              onClick={handleCreateFirstSong}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
            >
              Criar Nova Música
            </button>
          </div>
        </div>

        {/* Barra de busca e ordenação */}
        {songs.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <div className="relative">
                <Search className="w-4 h-4 text-blue-200 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Buscar por título..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-blue-200/70"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigas</SelectItem>
                  <SelectItem value="title">Título A-Z</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="failed">Falhas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

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
            {songs
              .filter((s) => (statusFilter === 'all' ? true : (s.status || 'completed').toLowerCase() === statusFilter))
              .filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))
              .sort((a, b) => {
                if (sortBy === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                return a.title.localeCompare(b.title);
              })
              .map((song) => (
              <div key={song.id} className="space-y-3">
                <SongCard 
                  song={{
                    id: song.id,
                    title: song.title,
                    audioUrl: song.audioUrl || '',
                    imageUrl: song.imageUrl,
                    lyrics: song.lyrics,
                    genre: undefined,
                    mood: undefined,
                    userId: song.userId,
                    guestId: song.guestId,
                    createdAt: song.createdAt,
                    audioUrlOption1: song.audioUrlOption1,
                    audioUrlOption2: song.audioUrlOption2,
                    status: song.status,
                  }} 
                  isPlaying={currentId === song.id && isPlaying}
                  onPlay={(s, url) => handlePlay(song, url)}
                  onPause={handlePause}
                  onDownloadVersion={(label, url) => handleDownload(song, url, label)}
                  playingVersionLabel={currentId === song.id ? (currentVersionLabel as 'A' | 'B' | undefined) : undefined}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(song)}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-sm flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" /> Editar
                  </button>
                  <button
                    onClick={() => handleDownload(song)}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/musica/${song.id}`;
                      navigator.clipboard.writeText(link).then(() => {
                        // optional toast if available
                      }).catch(() => {});
                    }}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-sm flex items-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" /> Copiar Link
                  </button>
                  <button
                    onClick={() => handleShare(song)}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-sm flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" /> Compartilhar
                  </button>
                  <button
                    onClick={() => handleDelete(song)}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-md text-sm flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir música?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A música "{songPendingDelete?.title}" será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MinhasMusicas;
