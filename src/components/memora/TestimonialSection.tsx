import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from '@/components/ui/button';

const TestimonialSection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      text: "Recebi uma música da minha filha no meu aniversário e foi o presente mais emocionante que já ganhei.",
      author: "Maria",
      age: 42,
      location: "São Paulo",
      avatar: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=middle%20aged%20woman%20smiling%20warmly%20portrait%20happy%20mother%20professional%20photo&image_size=square",
      rating: 5
    },
    {
      id: 2,
      text: "Criei uma música para o meu marido no nosso aniversário de casamento. Ele chorou de emoção quando ouviu.",
      author: "Ana",
      age: 35,
      location: "Rio de Janeiro",
      avatar: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=young%20woman%20smiling%20portrait%20happy%20wife%20professional%20photo%20warm%20lighting&image_size=square",
      rating: 5
    },
    {
      id: 3,
      text: "Nunca imaginei que seria tão fácil criar uma música personalizada. O resultado superou todas as minhas expectativas.",
      author: "Carlos",
      age: 28,
      location: "Belo Horizonte",
      avatar: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=young%20man%20smiling%20portrait%20happy%20professional%20photo%20confident%20expression&image_size=square",
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
    <section className="py-20 bg-memora-primary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border border-white/20 rounded-full" />
        <div className="absolute bottom-20 right-20 w-24 h-24 border border-white/20 rounded-full" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-white/20 rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
            O que nossos usuários dizem
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Histórias reais de pessoas que transformaram suas memórias em música
          </p>
        </div>

        {/* Main Testimonial */}
        <div className="relative">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-white/20">
            {/* Quote Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 bg-memora-secondary rounded-full flex items-center justify-center">
                <Quote className="w-8 h-8 text-memora-primary" />
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
                  <Star key={i} className="w-6 h-6 text-memora-secondary fill-current" />
                ))}
              </div>

              {/* Author Info */}
              <div className="flex items-center justify-center space-x-4">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-white/20">
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
                  <div className="text-white/70">
                    {currentTest.location}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          {testimonials.length > 1 && (
            <>
              <Button
                onClick={prevTestimonial}
                variant="ghost"
                size="sm"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 group p-0"
                aria-label="Depoimento anterior"
              >
                <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              </Button>
              
              <Button
                onClick={nextTestimonial}
                variant="ghost"
                size="sm"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 group p-0"
                aria-label="Próximo depoimento"
              >
                <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
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
                    ? 'bg-memora-secondary scale-125'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Ir para depoimento ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-16 grid sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl lg:text-5xl font-heading font-bold text-memora-secondary mb-2">
              500+
            </div>
            <div className="text-white/80">
              Músicas criadas
            </div>
          </div>
          
          <div>
            <div className="text-4xl lg:text-5xl font-heading font-bold text-memora-secondary mb-2">
              4.9★
            </div>
            <div className="text-white/80">
              Avaliação média
            </div>
          </div>
          
          <div>
            <div className="text-4xl lg:text-5xl font-heading font-bold text-memora-secondary mb-2">
              98%
            </div>
            <div className="text-white/80">
              Satisfação dos usuários
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button
            className="bg-memora-secondary hover:bg-memora-secondary/90 text-memora-primary font-heading font-bold py-4 px-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            data-attr="testimonial-cta-create-music"
            size="lg"
          >
            Criar minha música agora
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;