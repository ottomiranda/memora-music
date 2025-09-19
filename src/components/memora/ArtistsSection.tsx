import React, { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { songsApi } from "@/config/api";
import type { Song } from "@/types/guest";
import { useAudioPlayerStore } from "@/store/audioPlayerStore";
import { useMusicStore } from "@/store/musicStore";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import SectionTitle from '../ui/SectionTitle';
import SectionSubtitle from '../ui/SectionSubtitle';
import { toast } from "sonner";
import { getSunoAudioLinks } from "@/lib/sunoAudio";

const fallbackGenres = [
  "Pop", "R&B", "Soul", "Hip hop", "Latin Pop", "Ballad",
  "Cinematic", "Opera", "Soul/Funk", "Pop/EDM",
];

const pickAudioUrl = (song: Song): string | null => {
  return (song as any).audioUrlOption1 || (song as any).audioUrlOption2 || song.audioUrl || null;
};

// Extrai apenas o subestilo escolhido (ex.: "Sertanejo - Sertanejo Universitário" -> "Sertanejo Universitário")
const extractChosenStyle = (value?: string): string => {
  if (!value) return "";
  const separators = [" - ", " — ", " – ", ": ", "/"];
  let out = value;
  for (const sep of separators) {
    if (out.includes(sep)) out = out.split(sep).pop()!.trim();
  }
  return out;
};

// Helpers para checar mídia
const hasAudio = (s: Song) => Boolean((s as any).audioUrlOption1 || (s as any).audioUrlOption2 || s.audioUrl);
const hasCover = (s: Song) => Boolean(s.imageUrl);

const ArtistsSection: React.FC = () => {
  const [items, setItems] = useState<Song[]>([]);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [loadingSongId, setLoadingSongId] = useState<string | null>(null);
  const audioCache = useRef(new Map<string, { playbackUrl: string; downloadUrl?: string | null }>());
  const { currentId, isPlaying, play, pause } = useAudioPlayerStore();

  useEffect(() => {
    let mounted = true;
    
    const fetchSongs = async () => {
      try {
        console.log('[ArtistsSection] Iniciando busca de músicas...');
        
        const resp = await songsApi.discover(24);
        console.log('[ArtistsSection] Resposta da API:', resp);
        
        const listRaw: Song[] = (resp?.data?.songs || resp?.songs || []) as Song[];
        console.log('[ArtistsSection] Músicas brutas encontradas:', listRaw.length);
        
        const withCover = listRaw.filter((s) => hasCover(s));
        console.log('[ArtistsSection] Músicas com capa:', withCover.length);
        
        const withAudio = listRaw.filter((s) => hasAudio(s));
        console.log('[ArtistsSection] Músicas com áudio:', withAudio.length);
        
        const finalSongs = listRaw.filter((s) => hasCover(s) && hasAudio(s)).slice(0, 12);
        console.log('[ArtistsSection] Músicas finais filtradas:', finalSongs.length, finalSongs);
        
        // Log detalhado de cada música para debug
        finalSongs.forEach((song, index) => {
          console.log(`[ArtistsSection] Música ${index + 1}:`, {
            id: song.id,
            title: song.title,
            style: song.style,
            audioUrl: pickAudioUrl(song),
            coverUrl: song.imageUrl,
            hasAudio: hasAudio(song),
            hasCover: hasCover(song),
            // Propriedades de áudio detalhadas
            audioUrlOption1: (song as any).audioUrlOption1,
            audioUrlOption2: (song as any).audioUrlOption2,
            originalAudioUrl: song.audioUrl,
            source: song.id.toString().startsWith('suno_') ? 'Suno AI' : 'API Principal'
          });
        });
        
        if (!mounted) return;
        setItems(finalSongs);
      } catch (e) {
        console.error('[ArtistsSection] erro ao buscar músicas públicas:', e);
        if (mounted) setItems([]);
      }
    };

    fetchSongs();

    return () => {
       mounted = false;
     };
  }, []);

  const resolveAudioForSong = async (song: Song) => {
    const cached = audioCache.current.get(song.id);
    if (cached) {
      return cached;
    }

    const localUrl = pickAudioUrl(song);
    const taskId = song.sunoTaskId || (typeof song.id === 'string' && song.id.startsWith('suno_') ? song.id.replace('suno_', '') : null);

    if (taskId) {
      const links = await getSunoAudioLinks(taskId);
      if (links?.streamUrl) {
        const entry = {
          playbackUrl: links.streamUrl,
          downloadUrl: links.audioUrl || localUrl || null,
        };
        audioCache.current.set(song.id, entry);
        return entry;
      }
    }

    if (localUrl) {
      const entry = { playbackUrl: localUrl, downloadUrl: localUrl };
      audioCache.current.set(song.id, entry);
      return entry;
    }

    return null;
  };

  const handlePlay = async (song: Song) => {
    console.log('[ArtistsSection] handlePlay chamado para música:', song.id, song.title);
    
    if (currentId === song.id && isPlaying) {
      console.log('[ArtistsSection] Pausando música atual');
      pause();
      return;
    }
    try {
      setLoadingSongId(song.id);
      console.log('[ArtistsSection] Buscando URLs da Suno para a música:', song.id);
      const resolved = await resolveAudioForSong(song);
      console.log('[ArtistsSection] Resultado da busca de áudio:', resolved);

      if (!resolved?.playbackUrl) {
        toast.error('Não foi possível carregar o áudio desta música.');
        return;
      }

      console.log('[ArtistsSection] Iniciando reprodução da música:', song.id);
      setBgUrl(song.imageUrl || null);
      play(song.id, resolved.playbackUrl, {
        title: song.title,
        versionLabel: (song as any).audioUrlOption2 && !(song as any).audioUrlOption1 ? 'B' : 'A'
      });
    } catch (error) {
      console.error('[ArtistsSection] Erro ao preparar áudio:', error);
      toast.error('Erro ao tocar a música. Tente novamente em instantes.');
    } finally {
      setLoadingSongId((current) => (current === song.id ? null : current));
    }
  };

  const sectionBgStyle = useMemo(() => (
    bgUrl
      ? { backgroundImage: `url(${bgUrl})` }
      : undefined
  ), [bgUrl]);

  return (
    <section id="artistas" className="py-20 relative overflow-hidden">
      
      {/* Dynamic cover background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 blur-lg transition-[background-image] duration-500"
        style={sectionBgStyle}
        aria-hidden="true"
      />

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <SectionTitle className="text-white drop-shadow">
            Artistas que dão voz às suas memórias
          </SectionTitle>
          <SectionSubtitle className="mt-3 text-white/90 max-w-3xl mx-auto">
            Descubra vozes únicas e estilos variados para dar vida às suas memórias. Clique para ouvir e deixe a capa do álbum iluminar o momento.
          </SectionSubtitle>
        </div>

        {/* Grid 2 linhas x 6 colunas (12 itens) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
          {items.slice(0, 12).map((song, idx) => {
            const cover = song.imageUrl || '';
            const genre = extractChosenStyle(song.genre) || fallbackGenres[idx % fallbackGenres.length];
            const active = currentId === song.id && isPlaying;
            const isLoading = loadingSongId === song.id;
            return (
              <button
                key={song.id}
                onClick={() => handlePlay(song)}
                disabled={isLoading}
                className={`group relative aspect-square rounded-2xl overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.25)] bg-black/30 ring-1 ring-white/10 hover:ring-white/30 transition spotlight ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
                aria-label={`Reproduzir ${song.title}`}
              >
                {/* Cover */}
                <img src={cover} alt={song.title} className="absolute inset-0 w-full h-full object-cover" />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-black/10 to-transparent" />
                {/* Genre pill */}
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white bg-black/60 backdrop-blur text-left">
                  {genre}
                </div>
                {/* Play button */}
                <div className="absolute bottom-2 right-2">
                  <div className="w-11 h-11 rounded-full bg-white/70 group-hover:bg-white/90 flex items-center justify-center shadow-md">
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                    ) : active ? (
                      <Pause className="w-5 h-5 text-black" />
                    ) : (
                      <Play className="w-5 h-5 text-black ml-0.5" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <div className="relative mt-10 text-center">
          <div className="inline-flex flex-col items-center gap-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-5">
            <span className="text-white/90 text-sm sm:text-base">
              Gostou do que ouviu? Crie sua própria música personalizada agora mesmo.
            </span>
            <ArtistsCTAButton />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArtistsSection;

// CTA button component co-located for clarity
const ArtistsCTAButton: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { startNewCreationFlow } = useMusicStore();

  const onClick = async () => {
    try {
      await startNewCreationFlow(navigate, token || null);
    } catch (e) {
      console.error('[ArtistsCTAButton] erro ao iniciar fluxo de criação', e);
      navigate('/criar');
    }
  };

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-white text-black font-semibold shadow hover:shadow-md transition"
    >
      Crie sua música grátis
    </button>
  );
};
