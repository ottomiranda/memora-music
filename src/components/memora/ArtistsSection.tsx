import React, { useEffect, useMemo, useState } from "react";
import { Play, Pause } from "lucide-react";
import { songsApi } from "@/config/api";
import type { Song } from "@/types/guest";
import { useAudioPlayerStore } from "@/store/audioPlayerStore";
import { useMusicStore } from "@/store/musicStore";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

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
  const { currentId, isPlaying, play, pause } = useAudioPlayerStore();

  useEffect(() => {
    let mounted = true;
    songsApi
      .discover(24)
      .then((resp: any) => {
        const listRaw: Song[] = (resp?.data?.songs || resp?.songs || []) as Song[];
        const list = listRaw.filter((s) => hasCover(s) && hasAudio(s)).slice(0, 12);
        if (!mounted) return;
        setItems(list);
      })
      .catch((e) => {
        console.error('[ArtistsSection] erro ao buscar músicas públicas:', e);
        if (mounted) setItems([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handlePlay = (song: Song) => {
    const url = pickAudioUrl(song);
    if (!url) return;
    if (currentId === song.id && isPlaying) {
      pause();
      return;
    }
    setBgUrl(song.imageUrl || null);
    play(song.id, url, { title: song.title, versionLabel: (song as any).audioUrlOption2 && !(song as any).audioUrlOption1 ? 'B' : 'A' });
  };

  const sectionBgStyle = useMemo(() => (
    bgUrl
      ? { backgroundImage: `url(${bgUrl})` }
      : undefined
  ), [bgUrl]);

  return (
    <section id="artistas" className="relative py-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#052a66] via-[#073777] to-[#082a55]" aria-hidden="true" />
      {/* Dynamic cover background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 blur-lg transition-[background-image] duration-500"
        style={sectionBgStyle}
        aria-hidden="true"
      />

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white drop-shadow">
            Artistas que dão voz às suas memórias
          </h2>
          <p className="mt-3 text-white/90 max-w-3xl mx-auto text-sm sm:text-base">
            Descubra vozes únicas e estilos variados para dar vida às suas memórias. Clique para ouvir e deixe a capa do álbum iluminar o momento.
          </p>
        </div>

        {/* Grid 2 linhas x 6 colunas (12 itens) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
          {items.slice(0, 12).map((song, idx) => {
            const cover = song.imageUrl || '';
            const genre = extractChosenStyle(song.genre) || fallbackGenres[idx % fallbackGenres.length];
            const active = currentId === song.id && isPlaying;
            return (
              <button
                key={song.id}
                onClick={() => handlePlay(song)}
                className="group relative aspect-square rounded-2xl overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.25)] bg-black/30 ring-1 ring-white/10 hover:ring-white/30 transition spotlight"
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
                    {active ? (
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
