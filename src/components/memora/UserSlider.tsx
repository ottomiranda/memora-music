'use client';

import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { Volume2, VolumeX } from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

interface UserSlide {
  id: number;
  name: string;
  video: string;
}

const userSlides: UserSlide[] = [
  {
    id: 1,
    name: "Despedida",
    video: "/Videos/Despedida.mp4"
  },
  {
    id: 2,
    name: "Dia dos Pais",
    video: "/Videos/DiaPais.mp4"
  },
  {
    id: 3,
    name: "Saudade de Amor",
    video: "/Videos/SaudadeAmor.mp4"
  },
  {
    id: 4,
    name: "Aniversário de Casamento",
    video: "/Videos/aniversarioCasamento.mp4"
  },
  {
    id: 5,
    name: "Aniversário do Pai",
    video: "/Videos/aniversarioPai.mp4"
  },
  {
    id: 6,
    name: "Dia das Mães",
    video: "/Videos/diamaes.mp4"
  },
  {
    id: 7,
    name: "Honrar Memorial",
    video: "/Videos/honrarMemorial.mp4"
  },
  {
    id: 8,
    name: "Melhores Amigas",
    video: "/Videos/melhoresAmigas.mp4"
  },
  {
    id: 9,
    name: "Para Vovô",
    video: "/Videos/paraVovo.mp4"
  },
  {
    id: 10,
    name: "Pedido de Casamento",
    video: "/Videos/pedidoCasamento.mp4"
  }
];

export default function UserSlider() {
  // Force component re-render with timestamp

  
  const swiperRef = useRef<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [mutedStates, setMutedStates] = useState<boolean[]>(new Array(userSlides.length).fill(true));
  const [allMuted, setAllMuted] = useState<boolean>(true);
  const [hasPlayedBefore, setHasPlayedBefore] = useState<boolean[]>(new Array(userSlides.length).fill(false));



  const toggleMute = (index: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    // Novo comportamento: sincroniza mute para TODOS os vídeos
    const newMuted = !allMuted;
    setAllMuted(newMuted);
    setMutedStates(Array(userSlides.length).fill(newMuted));
    // Atualiza imediatamente os elementos de vídeo montados
    videoRefs.current.forEach((vid) => {
      if (vid) vid.muted = newMuted;
    });
  };

  const handleVideoClick = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Only handle click if this is the active slide
    if (index === activeIndex) {
      toggleMute(index);
    }
  };

  // Auto-play effect when activeIndex changes (only after user interaction)
  useEffect(() => {
    const attemptPlay = async () => {
      // Only attempt autoplay after user has interacted
      if (!userInteracted) {
        return;
      }
      
      // Ensure activeIndex is valid
      if (activeIndex < 0 || activeIndex >= userSlides.length) {
        return;
      }
      
      // Pause all videos first
      videoRefs.current.forEach((ref, idx) => {
        if (ref && idx !== activeIndex) {
          ref.pause();
        }
      });
      
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const videoRef = videoRefs.current[activeIndex];
      if (videoRef) {
        try {
          videoRef.currentTime = 0;
          await videoRef.play();
  
        } catch (error) {
          console.error(`❌ Auto-play prevented for video ${activeIndex}:`, userSlides[activeIndex]?.title, error.name);
        }
      }
    };
    
    if (userSlides.length > 0) {
      attemptPlay();
    }
  }, [activeIndex, userSlides, userInteracted]);
  
  // Initial setup effect - runs once on mount
  useEffect(() => {
    // Ensure we start with index 0
    if (activeIndex !== 0) {
      setActiveIndex(0);
    }
  }, []);

  // Test function to manually change slides
  const testSlideChange = () => {
    const nextIndex = (activeIndex + 1) % userSlides.length;

    setActiveIndex(nextIndex);
    if (swiperRef.current) {
      swiperRef.current.slideTo(nextIndex);
    }
  };

  const testPreviousSlide = () => {
    const prevIndex = activeIndex === 0 ? userSlides.length - 1 : activeIndex - 1;

    setActiveIndex(prevIndex);
    if (swiperRef.current) {
      swiperRef.current.slideTo(prevIndex);
    }
  };
  
  return (
    <div className="user-slider-container w-full py-12">

      <style>{`
        .user-slider-container {
          max-width: 1320px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        
        .user-slider .swiper {
          width: 100%;
          padding: 50px 0;
        }

        .user-slider .swiper-slide {
          position: relative;
          width: 200px;
          height: 360px;
          border-radius: 18px;
          overflow: hidden;
          transition: all 0.6s ease;
          user-select: none;
          cursor: pointer;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .user-slider .swiper-slide::after {
          content: '';
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.55) 100%);
          z-index: 1;
          transition: all 0.6s ease;
        }

        /* Red tint overlay to match mock */
        .user-slider .swiper-slide::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(120, 0, 0, 0.25);
          z-index: 0;
          transition: opacity 0.6s ease;
          opacity: 1;
        }

        .user-slider .swiper-slide video {
          position: absolute;
          left: 0;
          top: -46px; /* shift up so the cropped area fica fora do cartão */
          width: 100%;
          height: calc(100% + 92px); /* estende 46px acima e 46px abaixo para permitir o recorte */
          object-fit: cover;
          object-position: center top;
          /* Recorta 46px no topo e 46px na base mantendo a área visível igual ao cartão */
          clip-path: inset(46px 0 46px 0);
          -webkit-clip-path: inset(46px 0 46px 0);
          transition: all 0.6s ease;
        }

        .user-slider .swiper-slide p {
          position: absolute;
          left: 14px;
          bottom: 12px;
          right: auto;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 700;
          font-style: italic;
          letter-spacing: 0.5px;
          z-index: 2;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.4s ease;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9);
          text-align: left;
        }

        .user-slider .mute-button {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          background: rgba(0, 0, 0, 0.6);
          border: none;
          border-radius: 50%;
          color: #fff;
          cursor: pointer;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
          opacity: 0;
          transform: scale(0.8);
        }

        .user-slider .mute-button svg {
          width: 18px;
          height: 18px;
          display: block;
        }

        .user-slider .mute-button:hover {
          background: rgba(0, 0, 0, 0.8);
          transform: scale(1.1);
        }

        .user-slider .swiper-slide-active .mute-button {
          opacity: 1;
          transform: scale(1);
        }

        .user-slider .video-container {
          position: relative;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        .user-slider .video-container:hover .mute-button {
          opacity: 1;
          transform: scale(1);
        }

        .user-slider .swiper-slide-active {
          width: 320px !important;
          height: 520px !important;
          transition: all 0.6s ease;
          box-shadow: 0 14px 60px rgba(0, 0, 0, 0.35);
          border-color: rgba(255,255,255,0.12);
        }

        .user-slider .swiper-slide-active::after {
          background: linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.0) 60%, rgba(0,0,0,0.6) 100%);
        }

        .user-slider .swiper-slide-active::before {
          opacity: 0.1;
        }

        .user-slider .swiper-slide-active video {
          transform: scale(1.05);
        }

        .user-slider .swiper-slide-active p {
          transform: translateY(0);
          opacity: 1;
        }

        .user-slider .swiper-pagination {
          position: relative;
          margin-top: 30px;
        }

        .user-slider .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background-color: rgba(255, 255, 255, 0.35);
          border-radius: 50%;
          transition: all 0.3s ease;
          opacity: 1;
          margin: 0 4px;
        }

        .user-slider .swiper-pagination-bullet-active {
          width: 22px;
          height: 8px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 9999px;
          transform: none;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
        }

        /* Responsividade */
        @media (max-width: 1400px) {
          .user-slider .swiper-slide {
            width: 180px;
            height: 320px;
          }
          
          .user-slider .swiper-slide-active {
            width: 280px !important;
            height: 480px !important;
          }
        }

        @media (max-width: 1024px) {
          .user-slider-container {
            max-width: 100%;
            padding: 0 0.5rem;
          }
          
          .user-slider .swiper-slide {
            width: 160px;
            height: 280px;
          }
          
          .user-slider .swiper-slide-active {
            width: 240px !important;
            height: 420px !important;
          }
        }

        @media (max-width: 768px) {
          .user-slider .swiper {
            padding: 30px 0;
          }
          
          .user-slider .swiper-slide {
            width: 130px;
            height: 210px;
          }
          
          .user-slider .swiper-slide-active {
            width: 190px !important;
            height: 300px !important;
          }
          
          .user-slider .swiper-slide p {
            font-size: 0.75rem;
            left: 8px;
            right: 8px;
            bottom: 8px;
          }
          
          .user-slider .mute-button {
            width: 32px;
            height: 32px;
            top: 8px;
            right: 8px;
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .user-slider .swiper {
            padding: 20px 0;
          }
          
          .user-slider .swiper-slide {
            width: 120px;
            height: 180px;
          }
          
          .user-slider .swiper-slide-active {
            width: 160px !important;
            height: 240px !important;
          }
          
          .user-slider .swiper-slide p {
            font-size: 0.7rem;
            left: 6px;
            right: 6px;
            bottom: 6px;
          }
          
          .user-slider .swiper-pagination-bullet {
            width: 6px;
            height: 6px;
          }
          
          .user-slider .mute-button {
            width: 28px;
            height: 28px;
            top: 6px;
            right: 6px;
            font-size: 10px;
          }
        }
      `}</style>
      
      <div className="user-slider">

        <Swiper
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={"auto"}
          loop={false}
          coverflowEffect={{
            rotate: 15,
            stretch: 0,
            depth: 140,
            modifier: 1,
            slideShadows: false,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          modules={[EffectCoverflow, Pagination]}
          onSlideChange={(swiper) => {
            setActiveIndex(swiper.realIndex);
            setUserInteracted(true); // Mark user interaction when manually navigating
            
            // Force play the new active video after a short delay
            setTimeout(() => {
              const newActiveIndex = swiper.realIndex;
              
              // Pause all other videos first
              videoRefs.current.forEach((ref, idx) => {
                if (ref && idx !== newActiveIndex) {
                  ref.pause();
                }
              });
              
              // Try to play the active video
              const activeVideo = videoRefs.current[newActiveIndex];
              if (activeVideo) {
                activeVideo.currentTime = 0;
                activeVideo.play().catch((error) => {
                  console.error('❌ Auto-play failed for video:', newActiveIndex, error);
                });
              }
            }, 100);
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            setActiveIndex(swiper.realIndex);
          }}
          onClick={(swiper) => {
            const clickedIndex = swiper.clickedIndex;
            if (clickedIndex !== undefined && clickedIndex !== activeIndex) {
              setActiveIndex(clickedIndex);
            }
          }}
          className="w-full h-full"
        >
          {userSlides.map((slide, index) => (
            <SwiperSlide key={slide.id}>
              <div className="video-container">
                <video
                  ref={(el) => {
                    videoRefs.current[index] = el;
                    if (el) {
        
                    }
                  }}
                  src={slide.video}
                  muted={mutedStates[index]}
                  loop={true}
                  playsInline={true}
                  preload="auto"
                  onError={(e) => {
                     console.error(`❌ Video error for ${slide.name}:`, e.currentTarget.error);
                   }}
                   
                   

                  onClick={(e) => handleVideoClick(index, e)}
                />
                <button
                  className="mute-button"
                  onClick={(e) => toggleMute(index, e)}
                  aria-label={allMuted ? 'Ativar som' : 'Desativar som'}
                >
                  {allMuted ? (
                    <VolumeX className="w-[18px] h-[18px] text-secondary" />
                  ) : (
                    <Volume2 className="w-[18px] h-[18px] text-secondary" />
                  )}
                </button>
                <p>{slide.name}</p>
              </div>
            </SwiperSlide>
          ))}
          <div className="swiper-pagination"></div>
        </Swiper>
      </div>
    </div>
  );
}
