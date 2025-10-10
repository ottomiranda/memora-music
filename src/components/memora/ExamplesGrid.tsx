import React, { useEffect, useRef, useState, useMemo } from "react";
import { Play, Heart, Calendar, Users, Gift, Music, Sparkles } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";

import { songsApi } from "@/config/api";
import type { Song } from "@/types/guest";
import { useAudioPlayerStore } from "@/store/audioPlayerStore";
import SectionTitle from '../ui/SectionTitle';
import { SectionSubtitle } from '@/components/ui/SectionSubtitle';
import { toast } from 'sonner';
import { getSunoAudioLinks } from '@/lib/sunoAudio';
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { useMusicStore } from "@/store/musicStore";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { LazyWrapper } from '@/hooks/useLazyLoading';
import { ExampleCardSkeleton } from '@/components/ui/skeleton';


const ExamplesGrid = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [linked, setLinked] = useState<Record<string, Song | null>>({});
  const { startNewCreationFlow } = useMusicStore();
  const navigate = useNavigate();
  const { t: tMarketing } = useTranslation('marketing');
  
  const THEME_KEYWORDS: Record<string, string[]> = {
    'aniversario': ['aniversário', 'birthday', 'bday'],
    'casamento': ['casamento', 'wedding', 'nupcial'],
    'amor': ['amor', 'love', 'romance', 'canção de amor'],
    'aniversario-casamento': ['aniversário de casamento', 'wedding anniversary', 'bodas'],
    'so-porque': ['só porque', 'just because', 'surpresa'],
    'proposta': ['proposta', 'pedido de casamento', 'proposal'],
    'graduacao': ['graduação', 'formatura', 'graduation'],
    'melhores-amigos': ['melhores amigos', 'best friends', 'amizade', 'friend'],
    'noivado': ['noivado', 'engagement'],
    'dia-pais': ['dia dos pais', 'father', 'pai'],
    'dia-maes': ['dia das mães', 'mother', 'mãe'],
    'natal': ['natal', 'christmas', 'noel']
  };

  const normalize = (s?: string) => (s || '').toLowerCase();
  const chooseAudioUrl = (s: Song): string | null => {
    const urls = [
      (s as any).audioUrlOption1,
      (s as any).audioUrlOption2,
      (s as any).audioUrl,
    ].filter(Boolean) as string[];
    const isValid = (u: string) => /^https?:\/\//.test(u) && /\.(mp3|wav|m4a|aac)(\?|$)/i.test(u);
    // prefer explicit extensions
    const withExt = urls.find(isValid);
    if (withExt) return withExt;
    // fallback to first http(s)
    const httpOnly = urls.find((u) => /^https?:\/\//.test(u));
    return httpOnly || null;
  };
  const hasAudio = (s: Song) => {
    const hasLocal = Boolean(chooseAudioUrl(s));
    const hasSuno = Boolean((s as any).sunoTaskId || (typeof s.id === 'string' && s.id.startsWith('suno_')));
    return hasLocal || hasSuno;
  };
  const hasCover = (s: Song) => Boolean((s as any).imageUrl);

  const matchByKeywords = (song: Song, words: string[]) => {
    const blob = [song.title, (song as any).genre, (song as any).mood, (song as any).prompt]
      .map((t) => normalize(t))
      .join(' | ');
    return words.some((w) => blob.includes(w.toLowerCase()));
  };

  const handleCreateMusic = async () => {
    const { token } = useAuthStore.getState();
    await startNewCreationFlow(navigate, token || null);
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        // Primeiro pool com um tamanho razoável
        const resp1: any = await songsApi.discover(80);
        let pool: Song[] = (resp1?.data?.songs || resp1?.songs || []) as Song[];
        // Garantir mídia
        pool = pool.filter((s) => hasCover(s) && hasAudio(s));

        // Se o pool for pequeno, tentar ampliar
        if (pool.length < 24) {
          try {
            const resp2: any = await songsApi.discover(160);
            const pool2: Song[] = (resp2?.data?.songs || resp2?.songs || []) as Song[];
            pool = [...pool, ...pool2].filter((s, idx, arr) => hasCover(s) && hasAudio(s) && arr.findIndex((x) => x.id === s.id) === idx);
          } catch (error) {
        console.error('Error fetching song:', error);
      }
        }

        // Construir candidatos por tema e garantir unicidade
        const usedIds = new Set<string>();
        const usedUrls = new Set<string>();
        const mapping: Record<string, Song | null> = {};

        const getNextUnique = (cands: Song[]): Song | null => {
          for (const s of cands) {
            const url = chooseAudioUrl(s);
            const canPlay = Boolean(url || (s as any).sunoTaskId || (typeof s.id === 'string' && s.id.startsWith('suno_')));
            if (!canPlay) continue;
            if (usedIds.has(s.id) || (url && usedUrls.has(url))) continue;
            usedIds.add(s.id);
            if (url) usedUrls.add(url);
            return s;
          }
          return null;
        };

        for (const ex of examples) {
          const words = THEME_KEYWORDS[ex.id] || [];
          const candidates = pool.filter((s) => matchByKeywords(s, words));
          let chosen = getNextUnique(candidates);
          if (!chosen) {
            // fallback: qualquer outro da pool que ainda não foi usado
            chosen = getNextUnique(pool);
          }
          mapping[ex.id] = chosen;
        }
        if (mounted) setLinked(mapping);
      } catch (e) {
        console.error('[ExamplesGrid] falha ao vincular músicas temáticas:', e);
      }
    };
    run();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const examplesBase: Array<{ id: string; image: string; icon: any; color: string; }> = [
    {
      id: "aniversario",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=birthday%20celebration%20brazilian%20diverse%20family%20colorful%20balloons%20cake%20warm%20lighting%20joyful%20atmosphere%20mixed%20ethnicity&image_size=square",
      icon: Gift,
      color: "memora-primary"
    },
    {
      id: "casamento",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20wedding%20ceremony%20brazilian%20couple%20diverse%20ethnicity%20flowers%20rings%20romantic%20atmosphere%20soft%20lighting%20cultural%20diversity&image_size=square",
      icon: Heart,
      color: "memora-coral"
    },
    {
      id: "amor",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=romantic%20brazilian%20couple%20mixed%20ethnicity%20holding%20hands%20walking%20together%20sunset%20golden%20hour%20love%20intimate%20moment%20cultural%20diversity&image_size=square",
      icon: Heart,
      color: "memora-coral"
    },
    {
      id: "aniversario-casamento",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20anniversary%20celebration%20mature%20couple%20diverse%20ethnicity%20golden%20rings%20flowers%20elegant%20romantic%20dinner%20candlelight%20intimate%20setting&image_size=square",
      icon: Calendar,
      color: "memora-secondary"
    },
    {
      id: "so-porque",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=spontaneous%20gesture%20love%20couple%20diverse%20ethnicity%20surprise%20gift%20warm%20colors%20heartfelt%20moment%20romantic%20atmosphere&image_size=square",
      icon: Heart,
      color: "memora-turquoise"
    },
    {
      id: "proposta",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=romantic%20marriage%20proposal%20scene%20in%20cozy%20living%20room%20with%20warm%20lighting%20man%20kneeling%20with%20ring%20woman%20surprised%20elegant%20home%20decor%20soft%20romantic%20atmosphere%20beautiful%20couple%20intimate%20moment%20television%20showing%20memories%20photos%20on%20wall%20rose%20petals%20on%20floor&image_size=square",
      icon: Gift,
      color: "memora-accent"
    },
    {
      id: "graduacao",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=graduation%20ceremony%20happy%20student%20cap%20gown%20university%20celebration%20diploma%20academic%20achievement%20diverse%20ethnicity%20joyful%20moment%20campus%20background%20festive%20atmosphere&image_size=square",
      icon: Users,
      color: "memora-secondary"
    },
    {
      id: "melhores-amigos",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=group%20friends%20diverse%20ethnicities%20laughing%20together%20outdoor%20picnic%20friendship%20celebration%20joyful%20bonding%20sunset%20park%20casual%20clothes&image_size=square",
      icon: Users,
      color: "memora-turquoise"
    },
    {
      id: "noivado",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=engagement%20celebration%20happy%20couple%20mixed%20ethnicity%20champagne%20rings%20joyful%20atmosphere%20romantic%20dinner&image_size=square",
      icon: Users,
      color: "memora-primary"
    },
    {
      id: "dia-pais",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=brazilian%20father%20diverse%20ethnicity%20playing%20with%20child%20outdoor%20park%20paternal%20bond%20family%20joy%20father%20day%20celebration%20cultural%20diversity&image_size=square",
      icon: Heart,
      color: "memora-primary"
    },
    {
      id: "dia-maes",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=mother%20diverse%20ethnicity%20hugging%20child%20garden%20flowers%20maternal%20love%20mother%20day%20warm%20sunlight%20tender%20moment&image_size=square",
      icon: Heart,
      color: "memora-coral"
    },
    {
      id: "natal",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=christmas%20celebration%20family%20diverse%20ethnicities%20decorated%20tree%20lights%20gifts%20cozy%20living%20room%20festive%20warm%20atmosphere%20holiday%20gathering&image_size=square",
      icon: Gift,
      color: "memora-secondary"
    }
  ];

  const examples = useMemo(() => 
    examplesBase.map((item) => ({
      ...item,
      title: tMarketing(`examples.cards.${item.id}.title`),
      subtitle: tMarketing(`examples.cards.${item.id}.subtitle`),
    })), [tMarketing]
  );

  const handlePlayPause = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
      // Simulate stopping after 15 seconds
      setTimeout(() => {
        setPlayingId(null);
      }, 15000);
    }
  };

  return (
    <section id="exemplos" className="py-16 xs:py-20 sm:py-24 md:py-28 lg:py-32 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 xs:mb-10 sm:mb-12 md:mb-14 lg:mb-16">
          <SectionTitle>
            {tMarketing('examples.title').split(' ').map((word, index, array) => 
              index === array.length - 1 ? (
                <span key={index} className="bg-gradient-to-r from-yellow-500 to-purple-600 bg-clip-text text-transparent">{word}</span>
              ) : (
                <span key={index}>{word} </span>
              )
            )}
          </SectionTitle>
          <SectionSubtitle>{tMarketing('examples.subtitle')}</SectionSubtitle>
        </div>

        {/* Examples Slider (Swiper Coverflow) */}
        <div className="min-h-[300px] xs:min-h-[350px] sm:min-h-[400px]">
          <ExamplesSwiper
            examples={examples}
            playingId={playingId}
            onTogglePlay={handlePlayPause}
            linked={linked}
          />
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 xs:mt-14 sm:mt-16">
          <div className="inline-flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="flex items-center space-x-2 text-white/50">
              <Music className="w-4 h-4 xs:w-5 xs:h-5" />
              <span className="font-medium text-sm xs:text-base">
                {tMarketing('examples.cta.meta')}
              </span>
            </div>
            <LiquidGlassButton
              onClick={handleCreateMusic}
              data-attr="examples-cta-button"
              className="w-full sm:w-auto font-heading font-bold min-h-[48px] px-6 xs:px-8 text-sm xs:text-base touch-manipulation"
            >
              <Sparkles className="mr-2 xs:mr-3 h-4 w-4 xs:h-5 xs:w-5" />
              {tMarketing('examples.cta.button')}
            </LiquidGlassButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExamplesGrid;

type Example = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  icon: any;
  color: string;
};
function ExamplesSwiper({
  examples,
  playingId,
  onTogglePlay,
  linked,
}: {
  examples: Example[];
  playingId: string | null;
  onTogglePlay: (id: string) => void;
  linked: Record<string, Song | null>;
}) {
  const { play, pause, currentId, isPlaying } = useAudioPlayerStore();
  const [loadingSongId, setLoadingSongId] = useState<string | null>(null);
  const audioCache = useRef(new Map<string, { playbackUrl: string; downloadUrl?: string | null }>());
  const { t: tMarketing } = useTranslation('marketing');

  const resolveAudioForSong = async (song: Song) => {
    const cached = audioCache.current.get(song.id);
    if (cached) return cached;

    const localUrl = chooseAudioUrl(song);
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

  const handleCardPlay = async (exampleId: string, song: Song | null) => {
    if (!song) {
      onTogglePlay(exampleId);
      return;
    }

    const assocId = song.id;

    if (currentId === assocId && isPlaying) {
      pause();
      return;
    }

    try {
      setLoadingSongId(assocId);
      const resolved = await resolveAudioForSong(song);

      if (!resolved?.playbackUrl) {
        toast.error('Não foi possível carregar a prévia desta música.');
        onTogglePlay(exampleId);
        return;
      }

      play(assocId, resolved.playbackUrl, { title: song.title });
    } catch (error) {
      console.error('[ExamplesSwiper] Erro ao tocar música:', error);
      toast.error('Falha ao reproduzir esta prévia.');
      onTogglePlay(exampleId);
    } finally {
      setLoadingSongId((current) => (current === assocId ? null : current));
    }
  };

  return (
    <div className="relative">


      <Swiper
        modules={[EffectCoverflow, Autoplay]}
        effect="coverflow"
        centeredSlides
        slidesPerView="auto"
        grabCursor
        loop
        spaceBetween={16}
        coverflowEffect={{ 
          rotate: 15, 
          stretch: 0, 
          depth: 100, 
          modifier: 1, 
          slideShadows: false 
        }}
        autoplay={{ 
          delay: 5000, 
          disableOnInteraction: false, 
          pauseOnMouseEnter: true 
        }}
        breakpoints={{
          320: {
            spaceBetween: 12,
            coverflowEffect: {
              rotate: 10,
              depth: 80,
              modifier: 0.8
            }
          },
          640: {
            spaceBetween: 20,
            coverflowEffect: {
              rotate: 12,
              depth: 90,
              modifier: 0.9
            }
          },
          768: {
            spaceBetween: 24,
            coverflowEffect: {
              rotate: 15,
              depth: 100,
              modifier: 1
            }
          },
          1024: {
            spaceBetween: 32,
            coverflowEffect: {
              rotate: 15,
              depth: 140,
              modifier: 1.1
            }
          }
        }}
        className="px-4 sm:px-6 md:px-8 lg:px-10"
      >
        {examples.map((example) => {
          const IconComponent = example.icon;
          const simulatedPlaying = playingId === example.id;
          const song = linked[example.id] || null;
          const assocId = song?.id || null;
          const isCardPlaying = assocId && currentId === assocId && isPlaying;
          const isLoading = assocId ? loadingSongId === assocId : false;

          return (
            <SwiperSlide key={example.id} className="!w-[85%] xs:!w-[82%] sm:!w-[78%] md:!w-[66%] lg:!w-[58%] xl:!w-[52%]">
              <div className="relative rounded-[22px] overflow-hidden shadow-2xl ring-1 ring-white/20">
                <div className="relative aspect-[1.4/1] xs:aspect-[1.5/1] sm:aspect-[1.62/1] md:aspect-[1.75/1] lg:aspect-[1.85/1] overflow-hidden">
                  <img
                    src={example.image}
                    alt={`Exemplo de música para ${example.title}`}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                    decoding="async"
                  />

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />

                  {/* Text + CTA (vertically centered) */}
                  <div className="absolute inset-0 flex flex-col justify-center pl-4 xs:pl-6 sm:pl-8 md:pl-10 lg:pl-12 pr-4 xs:pr-6 sm:pr-8 py-2">
                    <h3 className="font-heading text-white font-semibold drop-shadow-sm text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl max-w-[75%] mb-1 xs:mb-2 leading-tight">
                      {example.title}
                    </h3>
                    <p className="text-white/80 text-xs xs:text-sm sm:text-base mt-1 xs:mt-2 max-w-[85%] drop-shadow-sm leading-relaxed">
                      {example.subtitle}
                    </p>
                  <div className="mt-3 xs:mt-4 sm:mt-6">
                    <button
                      onClick={() => {
                        void handleCardPlay(example.id, song);
                      }}
                      disabled={isLoading}
                      className={`inline-flex items-center gap-1.5 xs:gap-2 rounded-lg px-3 xs:px-4 sm:px-5 py-2 xs:py-2.5 text-xs xs:text-sm sm:text-base font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] min-h-[44px] touch-manipulation ${
                        isCardPlaying || simulatedPlaying
                          ? "bg-white text-neutral-900 scale-105"
                          : "bg-white/20 hover:bg-white/30 active:bg-white/40 text-white border border-white/40 backdrop-blur hover:scale-105 active:scale-95"
                      } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                      aria-label={isLoading
                        ? tMarketing('examples.cardCta.aria.loading', { title: example.title })
                        : (isCardPlaying || simulatedPlaying)
                          ? tMarketing('examples.cardCta.aria.pause', { title: example.title })
                          : tMarketing('examples.cardCta.aria.play', { title: example.title })
                      }
                    >
                      <span className="tracking-wide">
                        {isLoading
                          ? tMarketing('examples.cardCta.loading')
                          : tMarketing('examples.cardCta.play')}
                      </span>
                      <span className={`ml-0.5 xs:ml-1 inline-flex h-4 w-4 xs:h-5 xs:w-5 items-center justify-center rounded-full ${
                        (isCardPlaying || simulatedPlaying) ? "bg-neutral-900 text-white" : "bg-yellow-400 text-neutral-900"
                      }`}>
                        {isLoading ? (
                          <div className="h-2.5 w-2.5 xs:h-3.5 xs:w-3.5 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                        ) : (
                          <Play className="h-2.5 w-2.5 xs:h-3.5 xs:w-3.5 translate-x-[1px]" />
                        )}
                      </span>
                    </button>
                  </div>
                  </div>

                  {/* Icon Badge */}
                  <div className={`absolute top-2 xs:top-3 sm:top-4 right-2 xs:right-3 sm:right-4 w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-${example.color}/90 backdrop-blur-sm`}>
                    <IconComponent className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>

                  {/* Playing Indicator */}
                  {(isCardPlaying || simulatedPlaying || isLoading) && (
                    <div className="absolute bottom-2 xs:bottom-3 left-2 xs:left-3 flex items-center space-x-1">
                      <div className="flex space-x-0.5 xs:space-x-1">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-0.5 xs:w-1 h-3 xs:h-4 bg-white rounded-full animate-pulse"
                            style={{
                              animationDelay: `${i * 0.2}s`,
                              animationDuration: "1s",
                            }}
                          />
                        ))}
                      </div>
                      <Music className="w-3 h-3 xs:w-4 xs:h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </SwiperSlide>
          );
        })}

        {/* Pagination dots rendered by Swiper */}
      </Swiper>
    </div>
  );
}

// Vincula músicas temáticas aos cards ao montar a página
// Estratégia: buscar um pool maior e fazer matching por palavras‑chave em título/gênero/humor/prompt
(function attachLinkingToComponent(){
  // no-op wrapper para organização
})();
