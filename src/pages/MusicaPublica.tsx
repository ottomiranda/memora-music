import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Music, Share2, Download, Loader2, ArrowLeft, Play, Pause } from 'lucide-react';
import { songsApi, API_BASE_URL } from '@/config/api';
import { forceDownload } from '@/utils/download';
import { buildMp3Filename } from '@/utils/filename';
import { useAudioPlayerStore } from '@/store/audioPlayerStore';
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
  console.log('[MusicaPublica] Componente renderizado');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('musicaPublica');
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
    console.log('[MusicaPublica] useEffect executado com ID:', id);
    const fetchSong = async () => {
      try {
        console.log('[MusicaPublica] Iniciando carregamento...');
        setLoading(true);
        setError(null);
        if (!id) return;
        console.log('[MusicaPublica] Buscando música pública...');
        const resp: any = await songsApi.getPublic(id);
        const data: PublicSong = resp?.data || resp; // compat
        console.log('[MusicaPublica] Música carregada com sucesso:', data);
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
        console.error('[MusicaPublica] Erro ao carregar música pública:', e);
        setError(e?.message || t('error.loadFailed'));
      } finally {
        console.log('[MusicaPublica] Finalizando carregamento...');
        setLoading(false);
      }
    };
    fetchSong();
  }, [id]);

  const isThisSongPlaying = useMemo(() => currentId === song?.id && isPlaying, [currentId, song?.id, isPlaying]);
  const currentVersionLabel = useMemo(() => {
    if (!song) return t('versions.versionA');
    if (!currentUrl) return t('versions.versionA');
    if (song.audioUrlOption2 && currentUrl === song.audioUrlOption2) return t('versions.versionB');
    if (song.audioUrlOption1 && currentUrl === song.audioUrlOption1) return t('versions.versionA');
    return t('versions.versionSuno');
  }, [song, currentUrl, t]);

  const handlePlay = async (url?: string | null, label?: 'A' | 'B') => {
    console.log('[MusicaPublica] ===== HANDLE PLAY CHAMADO =====');
    console.log('[MusicaPublica] Song disponível:', !!song);
    console.log('[MusicaPublica] Song ID:', song?.id);
    if (!song) {
      console.log('[MusicaPublica] ERRO: Song não disponível');
      return;
    }

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
        toast.error(t('error.audioLoadFailed'));
        return;
      }

      console.log('[MusicaPublica] Chamando play do audioPlayerStore:', { songId: song.id, toPlay, title: song.title, versionLabel: label });
      play(song.id, toPlay, { title: song.title, versionLabel: label });
    } catch (error) {
      console.error('Erro ao reproduzir música pública:', error);
      toast.error(t('error.playbackFailed'));
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
        toast.success(t('toast.linkCopied'));
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
      toast.error(t('error.downloadFailed'));
      return;
    }

    const baseName = `${song.title}${label ? `_${label}` : ''}`;
    const friendly = buildMp3Filename(baseName);
    
    // Debug logs para verificar o nome do arquivo
    console.log('🔍 Debug Download:');
    console.log('  - song.title:', song.title);
    console.log('  - label:', label);
    console.log('  - baseName:', baseName);
    console.log('  - friendly (com extensão):', friendly);
    
    try {
      const proxyUrl = `${API_BASE_URL}/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(friendly)}`;
      console.log('  - proxyUrl:', proxyUrl);
      await forceDownload(proxyUrl, friendly);
    } catch (e) {
      console.log('  - Fallback para URL direta');
      await forceDownload(url, friendly);
    }
  };

  if (loading) {
    console.log('[MusicaPublica] Renderizando estado de loading');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">{t('loading.message')}</p>
        </div>
      </div>
    );
  }

  if (error || !song) {
    console.log('[MusicaPublica] Renderizando estado de erro ou música não encontrada. Error:', error, 'Song:', !!song);
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 max-w-md text-center text-white">
          <p className="mb-4">{error || t('error.notFound')}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">{t('navigation.back')}</button>
        </div>
      </div>
    );
  }

  console.log('[MusicaPublica] Renderizando página da música. Song disponível:', !!song, 'currentVersionLabel:', currentVersionLabel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative">
      {song.imageUrl && (
        <div className="absolute inset-0 opacity-30 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${song.imageUrl})` }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-blue-900/80 to-indigo-900/80" />
      <div className="relative container mx-auto px-4 pt-40 pb-12">
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
                <p className="text-blue-200 text-sm">{t('info.createdAt')} {new Date(song.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleShare} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-sm flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> {t('actions.share')}
                </button>
                <button onClick={() => handleDownload()} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-sm flex items-center gap-2">
                  <Download className="w-4 h-4" /> {t('actions.download')}
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-white/90">
                {isThisSongPlaying ? (
                  <button onClick={handlePause} className="w-10 h-10 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center">
                    <Pause className="w-5 h-5 text-white" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      console.log('[MusicaPublica] ===== BOTÃO PLAY CLICADO =====');
                      const label = currentUrl === song.audioUrlOption2 ? 'B' : currentUrl === song.audioUrlOption1 ? 'A' : undefined;
                      console.log('[MusicaPublica] Label determinado:', label);
                      void handlePlay(undefined, label as 'A' | 'B' | undefined);
                    }}
                    disabled={loadingPlayback}
                    className="w-10 h-10 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
                  >
                    {loadingPlayback ? (
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play className="w-5 h-5 text-white" />
                    )}
                  </button>
                )}
                <div className="text-sm">
                  <div className="font-medium">{t('info.playing')} {currentVersionLabel}</div>
                  <div className="text-white/70">{t('info.selectVersion')}</div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{t('versions.versionA')}</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePickVersion('A')}
                        disabled={loadingPlayback}
                        className={`px-2 py-1 text-xs rounded-md bg-purple-600 text-white hover:bg-purple-700 ${loadingPlayback ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <Play className="w-3 h-3 inline mr-1" />{t('actions.play')}
                      </button>
                      <button onClick={() => handleDownload('A')} className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"><Download className="w-3 h-3 inline mr-1" />{t('actions.download')}</button>
                    </div>
                  </div>
                  {!song.audioUrlOption1 && <div className="text-white/60 text-sm">{t('info.unavailable')}</div>}
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{t('versions.versionB')}</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePickVersion('B')}
                        disabled={loadingPlayback}
                        className={`px-2 py-1 text-xs rounded-md bg-purple-600 text-white hover:bg-purple-700 ${loadingPlayback ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <Play className="w-3 h-3 inline mr-1" />{t('actions.play')}
                      </button>
                      <button onClick={() => handleDownload('B')} className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"><Download className="w-3 h-3 inline mr-1" />{t('actions.download')}</button>
                    </div>
                  </div>
                  {!song.audioUrlOption2 && <div className="text-white/60 text-sm">{t('info.unavailable')}</div>}
                </div>
              </div>

              {/* Mini progresso abaixo das versões, quando essa música estiver ativa */}
              {currentId === song.id && (
                <PublicMiniProgress />
              )}

              {song.lyrics && (
                <div className="mt-4 text-white/90">
                  <div className="text-sm font-semibold mb-2">{t('sections.lyrics')}</div>
                  <div className="rounded-lg bg-white/5 border border-white/10 p-4 max-h-80 overflow-y-auto">
                    <div className="whitespace-pre-wrap text-white/90">{song.lyrics}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
};

export default MusicaPublica;

// Mini progresso para página pública
const PublicMiniProgress: React.FC = () => {
  const { t } = useTranslation('musicaPublica');
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
        <span className="font-medium">{t('sections.progress')}</span>
        <span>{fmt(currentTime)} / {fmt(duration || 0)}</span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
