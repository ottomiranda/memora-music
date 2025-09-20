import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Music, Share2, Download, Loader2, ArrowLeft, Play, Pause } from 'lucide-react';
import { songsApi, API_BASE_URL } from '@/config/api';
import { triggerDownload } from '@/utils/download';
import { useAudioPlayerStore } from '@/store/audioPlayerStore';
import KaraokeLyrics from '@/components/KaraokeLyrics';
import { getSunoAudioLinks } from '@/lib/sunoAudio';
import { toast } from 'sonner';

interface PublicSong {
  id: string;
  title: string;
  imageUrl?: string | null;
  lyrics?: string | null;
  audioUrlOption1?: string | null;
  audioUrlOption2?: string | null;
  createdAt: string;
  generationStatus?: string | null;
  sunoTaskId?: string | null;
  taskId?: string | null;
}

const MusicaPublica: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [song, setSong] = useState<PublicSong | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [loadingPlayback, setLoadingPlayback] = useState(false);
  const audioCache = useRef(new Map<string, { playbackUrl: string; downloadUrl?: string | null }>());
  const { currentId, isPlaying, play, pause } = useAudioPlayerStore();

  const resolveAudioForSong = async (data: PublicSong | null) => {
    if (!data) return null;
    const cacheKey = data.id;
    const cached = audioCache.current.get(cacheKey);
    if (cached) return cached;

    const localUrl = data.audioUrlOption1 || data.audioUrlOption2 || null;
    const taskId = data.sunoTaskId || data.taskId || (typeof data.id === 'string' && data.id.startsWith('suno_') ? data.id.replace('suno_', '') : null);

    if (taskId) {
      const links = await getSunoAudioLinks(taskId);
      if (links?.streamUrl) {
        const entry = {
          playbackUrl: links.streamUrl,
          downloadUrl: links.audioUrl || localUrl || null,
        };
        audioCache.current.set(cacheKey, entry);
        return entry;
      }
    }

    if (localUrl) {
      const entry = { playbackUrl: localUrl, downloadUrl: localUrl };
      audioCache.current.set(cacheKey, entry);
      return entry;
    }

    return null;
  };

  useEffect(() => {
    const fetchSong = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!id) return;
        const resp: any = await songsApi.getPublic(id);
        const data: PublicSong = resp?.data || resp; // compat
        // Enriquecer com campo sunoTaskId, respeitando diferentes formatos da API
        const enriched: PublicSong = {
          ...data,
          sunoTaskId: data.sunoTaskId || (data as any).suno_task_id || data.taskId || (data as any).task_id || null,
          taskId: data.taskId || (data as any).task_id || null,
        };
        setSong(enriched);
        const resolved = await resolveAudioForSong(enriched);
        const url = resolved?.playbackUrl || enriched.audioUrlOption1 || enriched.audioUrlOption2 || null;
        setCurrentUrl(url);
      } catch (e: any) {
        console.error('Erro ao carregar música pública:', e);
        setError(e?.message || 'Não foi possível carregar a música.');
      } finally {
        setLoading(false);
      }
    };
    fetchSong();
  }, [id]);

  const isThisSongPlaying = useMemo(() => currentId === song?.id && isPlaying, [currentId, song?.id, isPlaying]);
  const currentVersionLabel = useMemo(() => {
    if (!song) return 'Versão A';
    if (!currentUrl) return 'Versão A';
    if (song.audioUrlOption2 && currentUrl === song.audioUrlOption2) return 'Versão B';
    if (song.audioUrlOption1 && currentUrl === song.audioUrlOption1) return 'Versão A';
    return 'Versão Suno';
  }, [song, currentUrl]);

  const handlePlay = async (url?: string | null, label?: 'A' | 'B') => {
    if (!song) return;

    try {
      setLoadingPlayback(true);

      let toPlay = url || currentUrl;
      if (!toPlay) {
        const resolved = await resolveAudioForSong(song);
        toPlay = resolved?.playbackUrl || null;
        if (resolved?.playbackUrl) {
          setCurrentUrl(resolved.playbackUrl);
        }
      }

      if (!toPlay) {
        toast.error('Não foi possível carregar o áudio desta música.');
        return;
      }

      play(song.id, toPlay, { title: song.title, versionLabel: label });
    } catch (error) {
      console.error('Erro ao reproduzir música pública:', error);
      toast.error('Falha ao reproduzir esta música. Tente novamente.');
    } finally {
      setLoadingPlayback(false);
    }
  };

  const handlePause = () => {
    pause();
  };

  const handlePickVersion = (which: 'A' | 'B') => {
    if (!song) return;
    const url = which === 'A' ? (song.audioUrlOption1 || null) : (song.audioUrlOption2 || null);
    setCurrentUrl(url);
    if (url) void handlePlay(url, which);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: song?.title || 'Minha música', url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copiado para a área de transferência');
      }
    } catch {}
  };

  const handleDownload = async (label?: 'A' | 'B') => {
    if (!song) return;
    let url = label === 'A' ? song.audioUrlOption1 : label === 'B' ? song.audioUrlOption2 : currentUrl;
    if (!url) {
      const resolved = await resolveAudioForSong(song);
      url = resolved?.downloadUrl || resolved?.playbackUrl || null;
    }

    if (!url) {
      toast.error('Não foi possível localizar o arquivo para download.');
      return;
    }

    const friendly = `${song.title}${label ? `_${label}` : ''}.mp3`;
    try {
      const proxyUrl = `${API_BASE_URL}/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(friendly)}`;
      await triggerDownload(proxyUrl, friendly);
    } catch (e) {
      await triggerDownload(url, friendly);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Carregando música...</p>
        </div>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 max-w-md text-center text-white">
          <p className="mb-4">{error || 'Música não encontrada.'}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="relative">
        {song.imageUrl && (
          <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${song.imageUrl})` }} />
        )}
        <div className="relative container mx-auto px-4 pt-25 pb-12">
          <button onClick={() => navigate(-1)} className="text-white/80 hover:text-white mb-6 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {song.imageUrl ? (
                  <img src={song.imageUrl} alt={song.title} className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-10 h-10 text-white/70" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-white mb-1 truncate">{song.title}</h1>
                <p className="text-blue-200 text-sm">Criada em {new Date(song.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleShare} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-sm flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Compartilhar
                </button>
                <button onClick={() => handleDownload()} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-sm flex items-center gap-2">
                  <Download className="w-4 h-4" /> Baixar
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-white/90">
                {isThisSongPlaying ? (
                  <button onClick={handlePause} className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center">
                    <Pause className="w-5 h-5 text-white" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const label = currentUrl === song.audioUrlOption2 ? 'B' : currentUrl === song.audioUrlOption1 ? 'A' : undefined;
                      void handlePlay(undefined, label as 'A' | 'B' | undefined);
                    }}
                    disabled={loadingPlayback}
                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
                  >
                    {loadingPlayback ? (
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play className="w-5 h-5 text-white" />
                    )}
                  </button>
                )}
                <div className="text-sm">
                  <div className="font-medium">Reproduzindo {currentVersionLabel}</div>
                  <div className="text-white/70">Selecione outra versão abaixo</div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Versão A</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePickVersion('A')}
                        disabled={loadingPlayback}
                        className={`px-2 py-1 text-xs rounded-md bg-blue-600 hover:bg-blue-700 ${loadingPlayback ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        Reproduzir
                      </button>
                      <button onClick={() => handleDownload('A')} className="px-2 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20">Baixar</button>
                    </div>
                  </div>
                  {!song.audioUrlOption1 && <div className="text-white/60 text-sm">Indisponível</div>}
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Versão B</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePickVersion('B')}
                        disabled={loadingPlayback}
                        className={`px-2 py-1 text-xs rounded-md bg-blue-600 hover:bg-blue-700 ${loadingPlayback ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        Reproduzir
                      </button>
                      <button onClick={() => handleDownload('B')} className="px-2 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20">Baixar</button>
                    </div>
                  </div>
                  {!song.audioUrlOption2 && <div className="text-white/60 text-sm">Indisponível</div>}
                </div>
              </div>

              {/* Mini progresso abaixo das versões, quando essa música estiver ativa */}
              {currentId === song.id && (
                <PublicMiniProgress />
              )}

              {song.lyrics && (
                <div className="mt-4 text-white/90">
                  <div className="text-sm font-semibold mb-2">Letra</div>
                  <KaraokeLyrics lyrics={song.lyrics} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicaPublica;

// Mini progresso para página pública
const PublicMiniProgress: React.FC = () => {
  const { currentTime, duration } = useAudioPlayerStore();
  const pct = Math.min(100, Math.max(0, duration ? (currentTime / Math.max(1, duration)) * 100 : 0));
  const fmt = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-white/80 mb-1">
        <span className="font-medium">Progresso</span>
        <span>{fmt(currentTime)} / {fmt(duration || 0)}</span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
