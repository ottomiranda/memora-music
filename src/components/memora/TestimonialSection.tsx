import { Star, Quote, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useState } from "react";
import UserSlider from './UserSlider';
import SectionTitle from '../ui/SectionTitle';
import SectionSubtitle from '@/components/ui/SectionSubtitle';
import { Button } from '@/components/ui/button';
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { useMusicStore } from "@/store/musicStore";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

const TestimonialSection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { startNewCreationFlow } = useMusicStore();
  const { token } = useAuthStore();
  const navigate = useNavigate();

  const testimonials = [
    {
      id: 1,
      text: "Nunca imaginei que seria tão fácil criar uma música personalizada. O resultado superou todas as minhas expectativas.",
      author: "Carlos",
      age: 28,
      location: "Belo Horizonte",
      avatar: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%2028%20year%20old%20Brazilian%20man%20with%20short%20dark%20hair%2C%20warm%20smile%2C%20olive%20skin%20tone%2C%20wearing%20casual%20shirt%2C%20studio%20lighting%2C%20clean%20background&image_size=square",
      rating: 5
    },
    {
      id: 2,
      text: "A música que criei para minha mãe no Dia das Mães foi o presente mais especial que já dei. Ela chorou de emoção!",
      author: "Maria",
      age: 42,
      location: "São Paulo",
      avatar: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%2042%20year%20old%20Brazilian%20woman%20with%20shoulder%20length%20brown%20hair%2C%20gentle%20smile%2C%20warm%20brown%20skin%20tone%2C%20wearing%20elegant%20blouse%2C%20studio%20lighting%2C%20clean%20background&image_size=square",
      rating: 5
    },
    {
      id: 3,
      text: "Incrível como a IA conseguiu capturar exatamente o sentimento que eu queria transmitir. A qualidade da música é profissional!",
      author: "João",
      age: 35,
      location: "Rio de Janeiro",
      avatar: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%2035%20year%20old%20Brazilian%20man%20with%20beard%2C%20confident%20smile%2C%20medium%20brown%20skin%20tone%2C%20wearing%20button%20up%20shirt%2C%20studio%20lighting%2C%20clean%20background&image_size=square",
      rating: 5
    },
    {
      id: 4,
      text: "Usei o Memora para criar uma música de aniversário para minha filha. Ela ficou tão feliz que pediu para tocar na festa toda!",
      author: "Ana",
      age: 38,
      location: "Salvador",
      avatar: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%2038%20year%20old%20Brazilian%20woman%20with%20curly%20black%20hair%2C%20joyful%20smile%2C%20darker%20skin%20tone%2C%20wearing%20colorful%20top%2C%20studio%20lighting%2C%20clean%20background&image_size=square",
      rating: 5
    },
    {
      id: 5,
      text: "Como músico, fiquei impressionado com a qualidade das composições. É uma ferramenta incrível para criar presentes únicos!",
      author: "Rafael",
      age: 31,
      location: "Recife",
      avatar: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%2031%20year%20old%20Brazilian%20man%20with%20wavy%20dark%20hair%2C%20artistic%20look%2C%20medium%20tan%20skin%20tone%2C%20wearing%20casual%20jacket%2C%20studio%20lighting%2C%20clean%20background&image_size=square",
      rating: 5
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTest = testimonials[currentTestimonial];



  return (
    <section id="depoimentos" className="py-[120px] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border border-white/20 rounded-full" />
        <div className="absolute bottom-20 right-20 w-24 h-24 border border-white/20 rounded-full" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-white/20 rounded-full" />
      </div>

      {/* Coração SVG de fundo com animação de pulsação optimizada */}
      <div className="memora-heart-wrapper absolute inset-x-0 flex items-center justify-center pointer-events-none z-0">
        <div className="memora-heart-ambient">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="memora-heart-svg w-72 h-72 sm:w-96 sm:h-96 md:w-[600px] md:h-[600px] lg:w-[1000px] lg:h-[1000px]"
            aria-hidden="true"
          >
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              fill="currentColor"
              className="text-memora-primary"
            />
          </svg>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <SectionTitle>
            Histórias que viraram <span className="bg-gradient-to-r from-yellow-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">presente</span>
          </SectionTitle>
          <SectionSubtitle className="max-w-3xl mx-auto">
            Veja como nossos usuários eternizaram momentos especiais em canções personalizadas.
          </SectionSubtitle>
        </div>

        {/* User Slider */}
        <UserSlider />

        {/* Main Testimonial */}
        <div className="relative">
          <LiquidGlassCard variant="primary" className="p-8 lg:p-12">
            {/* Quote Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                <Quote className="w-8 h-8 text-neutral-dark" />
              </div>
            </div>

            {/* Testimonial Content */}
            <div className="text-center mb-8">
              <blockquote className="text-2xl lg:text-3xl font-heading text-white leading-relaxed mb-8">
                "{currentTest.text}"
              </blockquote>

              {/* Rating */}
              <div className="flex justify-center mb-6">
                {[...Array(currentTest.rating)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-secondary fill-current" />
                ))}
              </div>

              {/* Author Info */}
              <div className="flex items-center justify-center space-x-4">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-black/10">
                  <img
                    src={currentTest.avatar}
                    alt={`Foto de ${currentTest.author}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <div className="text-white font-heading font-bold text-lg">
                    {currentTest.author}, {currentTest.age} anos
                  </div>
                  <div className="text-white/50">
                    {currentTest.location}
                  </div>
                </div>
              </div>
            </div>
          </LiquidGlassCard>

          {/* Navigation Arrows */}
          {testimonials.length > 1 && (
            <>
              <Button
                onClick={prevTestimonial}
                variant="ghost"
                size="sm"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/10 hover:bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 group p-0"
                aria-label="Depoimento anterior"
              >
                <ChevronLeft className="w-6 h-6 text-white/60 group-hover:scale-110 transition-transform" />
              </Button>
              
              <Button
                onClick={nextTestimonial}
                variant="ghost"
                size="sm"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/10 hover:bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 group p-0"
                aria-label="Próximo depoimento"
              >
                <ChevronRight className="w-6 h-6 text-white/60 group-hover:scale-110 transition-transform" />
              </Button>
            </>
          )}
        </div>

        {/* Testimonial Indicators */}
        {testimonials.length > 1 && (
          <div className="flex justify-center mt-8 space-x-3">
            {testimonials.map((_, index) => (
              <Button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                variant="ghost"
                size="sm"
                className={`w-3 h-3 rounded-full transition-all duration-300 p-0 h-3 min-w-0 ${
                  index === currentTestimonial
                    ? 'bg-white/60 scale-125'
                    : 'bg-black/20 hover:bg-black/30'
                }`}
                aria-label={`Ir para depoimento ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-16 grid sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl lg:text-5xl font-heading font-bold text-white mb-2">
              500+
            </div>
            <div className="text-white/50">
              Músicas criadas
            </div>
          </div>
          
          <div>
            <div className="text-4xl lg:text-5xl font-heading font-bold text-white mb-2">
              4.9<span className="text-yellow-500">★</span>
            </div>
            <div className="text-white/50">
              Avaliação média
            </div>
          </div>
          
          <div>
            <div className="text-4xl lg:text-5xl font-heading font-bold text-white mb-2">
              98%
            </div>
            <div className="text-white/50">
              Satisfação dos usuários
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <LiquidGlassButton
            onClick={async () => {
              try {
                await startNewCreationFlow(navigate, token || null);
              } catch (error) {
                console.error('[TestimonialSection] erro ao iniciar fluxo de criação', error);
                navigate('/criar');
              }
            }}
            data-attr="testimonial-cta-create-music"
            className="font-heading font-bold"
          >
            <Sparkles className="mr-3 h-5 w-5" />
            Crie sua música agora
          </LiquidGlassButton>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
