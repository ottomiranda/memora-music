import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Quote, Sparkles, Star } from 'lucide-react';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { SectionSubtitle } from '@/components/ui/SectionSubtitle';
import UserSlider from '@/components/memora/UserSlider';
import { useAuthStore } from '@/store/authStore';
import { useMusicStore } from '@/store/musicStore';
import { useLocalizedRoutes } from '@/hooks/useLocalizedRoutes';

const TestimonialSection = () => {
  const { t: tCommon } = useTranslation('common');
  const { t: tMarketing } = useTranslation('marketing');
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { startNewCreationFlow } = useMusicStore();
  const { buildPath } = useLocalizedRoutes();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Get testimonials from i18n
  const rawTestimonials = tMarketing('testimonials.items', { returnObjects: true }) as unknown;
  const testimonials = useMemo(() => {
    if (!Array.isArray(rawTestimonials)) {
      return [] as Array<{
        id: number;
        text: string;
        author: string;
        age: number | null;
        location: string;
        avatar: string;
        rating: number;
      }>;
    }

    return rawTestimonials
      .map((item, index) => {
        const data = item as Record<string, unknown>;

        const text = typeof data.text === 'string' ? data.text : '';
        const author = typeof data.author === 'string'
          ? data.author
          : typeof data.name === 'string'
            ? data.name
            : '';
        const age = typeof data.age === 'number' ? data.age : null;
        const location = typeof data.location === 'string'
          ? data.location
          : typeof data.role === 'string'
            ? data.role
            : '';
        const avatar = typeof data.avatar === 'string'
          ? data.avatar
          : `https://i.pravatar.cc/120?img=${index + 30}`;
        const rating = typeof data.rating === 'number' ? data.rating : 5;

        return {
          id: typeof data.id === 'number' ? data.id : index,
          text,
          author,
          age,
          location,
          avatar,
          rating,
        };
      })
      .filter((item) => item.text && item.author);
  }, [rawTestimonials]);

  const nextTestimonial = () => {
    if (isAnimating || !testimonials?.length) return;
    setIsAnimating(true);
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const prevTestimonial = () => {
    if (isAnimating || !testimonials?.length) return;
    setIsAnimating(true);
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  useEffect(() => {
    if (!testimonials?.length) return;
    
    const interval = setInterval(() => {
      nextTestimonial();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAnimating, testimonials]);

  const currentTest = testimonials?.[currentTestimonial];

  if (!testimonials?.length || !currentTest) {
    return null;
  }



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
            <span dangerouslySetInnerHTML={{ __html: tCommon('testimonials.title') }} />
          </SectionTitle>
          <SectionSubtitle className="max-w-3xl mx-auto">
            {tCommon('testimonials.subtitle')}
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
                {Array.from({ length: Math.max(1, Math.round(currentTest.rating || 0)) }).map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-secondary fill-current" />
                ))}
              </div>

              {/* Author Info */}
              <div className="flex items-center justify-center space-x-4">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-black/10">
                  <img
                    src={currentTest.avatar}
                    alt={tCommon('testimonials.altText.userPhoto', { name: currentTest.author })}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <div className="text-white font-heading font-bold text-lg">
                    {currentTest.author}
                  </div>
                  {(() => {
                    const details = [
                      typeof currentTest.age === 'number' ? tCommon('testimonials.meta.age', { age: currentTest.age }) : null,
                      currentTest.location || null,
                    ].filter(Boolean);

                    if (!details.length) {
                      return null;
                    }

                    return (
                      <div className="text-white/50">
                        {details.join(' • ')}
                      </div>
                    );
                  })()}
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
                aria-label={tCommon('testimonials.navigation.previous')}
              >
                <ChevronLeft className="w-6 h-6 text-white/60 group-hover:scale-110 transition-transform" />
              </Button>
              
              <Button
                onClick={nextTestimonial}
                variant="ghost"
                size="sm"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/10 hover:bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 group p-0"
                aria-label={tCommon('testimonials.navigation.next')}
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
                  aria-label={tCommon('testimonials.navigation.goTo', { number: index + 1 })}
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
              {tCommon('testimonials.stats.songsCreated')}
            </div>
          </div>
          
          <div>
            <div className="text-4xl lg:text-5xl font-heading font-bold text-white mb-2">
              4.9<span className="text-yellow-500">★</span>
            </div>
            <div className="text-white/50">
              {tCommon('testimonials.stats.averageRating')}
            </div>
          </div>
          
          <div>
            <div className="text-4xl lg:text-5xl font-heading font-bold text-white mb-2">
              98%
            </div>
            <div className="text-white/50">
              {tCommon('testimonials.stats.userSatisfaction')}
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
                navigate(buildPath('create'));
              }
            }}
              data-attr="testimonial-cta-create-music"
              className="font-heading font-bold"
            >
              <Sparkles className="mr-3 h-5 w-5" />
              {tCommon('testimonials.cta')}
            </LiquidGlassButton>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
