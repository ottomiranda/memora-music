import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Slide {
  id: number;
  src: string;
  alt: string;
}

const slides: Slide[] = [
  {
    id: 1,
    src: '/images/amigos2.png', // Grupo de amigos brindando
    alt: 'Grupo de amigos celebrando juntos'
  },
  {
    id: 2,
    src: '/images/casal.png', // Pedido de casamento
    alt: 'Momento especial de pedido de casamento'
  },
  {
    id: 3,
    src: '/images/maefilhoadulto.png', // Filho abraçando mãe idosa
    alt: 'Filho abraçando carinhosamente sua mãe'
  },
  {
    id: 4,
    src: '/images/pedidocasamento.png', // Casal jovem abraçado
    alt: 'Casal jovem em momento de carinho'
  }
];

interface HeroSlideshowProps {
  className?: string;
}

const HeroSlideshow: React.FC<HeroSlideshowProps> = ({ className = '' }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set());

  // Navegação para próximo slide
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  // Navegação para slide anterior
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Ir para slide específico
  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  // Lidar com erro de carregamento de imagem
  const handleImageError = useCallback((slideId: number) => {
    setImageErrors(prev => new Set(prev).add(slideId));
  }, []);

  // Lidar com sucesso no carregamento de imagem
  const handleImageLoad = useCallback((slideId: number) => {
    setImagesLoaded(prev => new Set(prev).add(slideId));
  }, []);

  // Auto-navegação
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // 5 segundos por slide

    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  // Pausar auto-navegação no hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  // Touch gestures para mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <div 
      className={`relative rounded-3xl overflow-hidden shadow-2xl group ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Container das imagens */}
      <div className="relative w-full h-[500px] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-800 ease-in-out transform ${
              index === currentSlide
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-105'
            }`}
            style={{
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {imageErrors.has(slide.id) ? (
              // Fallback quando a imagem falha ao carregar
              <div className="w-full h-full bg-gradient-to-br from-[#7B3FE4] to-[#3ECFBB] flex items-center justify-center">
                <div className="text-center text-white">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-60" />
                  <p className="text-lg font-medium opacity-80">{slide.alt}</p>
                  <p className="text-sm opacity-60 mt-2">Imagem não disponível</p>
                </div>
              </div>
            ) : (
              <img
                src={slide.src}
                alt={slide.alt}
                className="w-full h-full object-cover transition-transform duration-1000 ease-out"
                style={{
                  transform: index === currentSlide ? 'scale(1)' : 'scale(1.1)'
                }}
                onError={() => handleImageError(slide.id)}
                onLoad={() => handleImageLoad(slide.id)}
                loading="lazy"
              />
            )}
            
            {/* Gradient overlay para melhor contraste */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* Controles de navegação - Setas */}
      <Button
        onClick={prevSlide}
        variant="ghost"
        size="sm"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50 p-0"
        aria-label="Slide anterior"
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>

      <Button
        onClick={nextSlide}
        variant="ghost"
        size="sm"
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50 p-0"
        aria-label="Próximo slide"
      >
        <ChevronRight className="w-6 h-6" />
      </Button>

      {/* Indicadores (dots) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
        {slides.map((_, index) => (
          <Button
            key={index}
            onClick={() => goToSlide(index)}
            variant="ghost"
            size="sm"
            className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 p-0 h-3 min-w-0 ${
              index === currentSlide
                ? 'bg-white scale-125 animate-pulse'
                : 'bg-white/40 hover:bg-white/60 hover:scale-110'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Indicador de progresso */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
        <div 
          className="h-full bg-gradient-to-r from-[#7B3FE4] to-[#3ECFBB] transition-all duration-300 ease-linear"
          style={{
            width: `${((currentSlide + 1) / slides.length) * 100}%`
          }}
        />
      </div>
    </div>
  );
};

export default HeroSlideshow;