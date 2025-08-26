import { useState } from "react";
import { Play, Pause, Heart, Calendar, Users, Gift, Music } from "lucide-react";

const ExamplesGrid = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const examples = [
    {
      id: "aniversario",
      title: "Aniversário",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=birthday%20celebration%20with%20colorful%20balloons%20and%20cake%20warm%20lighting%20joyful%20atmosphere&image_size=square",
      icon: Gift,
      color: "memora-primary"
    },
    {
      id: "casamento",
      title: "Casamento",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20wedding%20ceremony%20with%20flowers%20and%20rings%20romantic%20atmosphere%20soft%20lighting&image_size=square",
      icon: Heart,
      color: "memora-coral"
    },
    {
      id: "amor",
      title: "Canção de Amor",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=romantic%20couple%20silhouette%20sunset%20heart%20shapes%20warm%20colors%20love%20theme&image_size=square",
      icon: Heart,
      color: "memora-coral"
    },
    {
      id: "aniversario-casamento",
      title: "Aniversário de Casamento",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20anniversary%20celebration%20golden%20rings%20flowers%20elegant%20romantic%20setting&image_size=square",
      icon: Calendar,
      color: "memora-secondary"
    },
    {
      id: "so-porque",
      title: "Só porque…",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=spontaneous%20gesture%20of%20love%20surprise%20gift%20warm%20colors%20heartfelt%20moment&image_size=square",
      icon: Heart,
      color: "memora-turquoise"
    },
    {
      id: "proposta",
      title: "Proposta",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=marriage%20proposal%20scene%20engagement%20ring%20romantic%20setting%20magical%20moment&image_size=square",
      icon: Heart,
      color: "memora-primary"
    },
    {
      id: "graduacao",
      title: "Graduação",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=graduation%20ceremony%20cap%20and%20diploma%20celebration%20achievement%20proud%20moment&image_size=square",
      icon: Users,
      color: "memora-secondary"
    },
    {
      id: "melhores-amigos",
      title: "Melhores Amigos",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=best%20friends%20together%20laughing%20friendship%20bond%20happy%20moments%20warm%20colors&image_size=square",
      icon: Users,
      color: "memora-turquoise"
    },
    {
      id: "noivado",
      title: "Noivado",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=engagement%20celebration%20couple%20happy%20ring%20romantic%20atmosphere%20love&image_size=square",
      icon: Heart,
      color: "memora-coral"
    },
    {
      id: "dia-pais",
      title: "Dia dos Pais",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=father%20and%20child%20bonding%20moment%20paternal%20love%20family%20warmth%20celebration&image_size=square",
      icon: Heart,
      color: "memora-primary"
    },
    {
      id: "dia-maes",
      title: "Dia das Mães",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=mother%20and%20child%20loving%20embrace%20maternal%20love%20flowers%20warm%20celebration&image_size=square",
      icon: Heart,
      color: "memora-coral"
    },
    {
      id: "natal",
      title: "Natal",
      image: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=christmas%20celebration%20tree%20lights%20family%20gathering%20festive%20warm%20atmosphere&image_size=square",
      icon: Gift,
      color: "memora-secondary"
    }
  ];

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
    <section id="exemplos" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-memora-black mb-4">
            Momentos que viram canção
          </h2>
          <p className="text-xl text-memora-gray max-w-4xl mx-auto">
            Há algo especial no poder das músicas de unir as pessoas e tornar momentos ainda mais significativos.
          </p>
        </div>

        {/* Examples Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6">
          {examples.map((example) => {
            const IconComponent = example.icon;
            const isPlaying = playingId === example.id;
            
            return (
              <div
                key={example.id}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={example.image}
                    alt={`Exemplo de música para ${example.title}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Play Button */}
                  <button
                    onClick={() => handlePlayPause(example.id)}
                    className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 ${
                      isPlaying ? 'bg-memora-primary text-white' : 'text-memora-black'
                    }`}
                    aria-label={`${isPlaying ? 'Pausar' : 'Reproduzir'} exemplo de ${example.title}`}
                    data-attr="example-play-button"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 ml-0.5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </button>
                  
                  {/* Icon Badge */}
                  <div className={`absolute top-3 right-3 w-8 h-8 bg-${example.color}/90 rounded-full flex items-center justify-center`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  
                  {/* Playing Indicator */}
                  {isPlaying && (
                    <div className="absolute bottom-3 left-3 flex items-center space-x-1">
                      <div className="flex space-x-1">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 h-4 bg-white rounded-full animate-pulse"
                            style={{
                              animationDelay: `${i * 0.2}s`,
                              animationDuration: '1s'
                            }}
                          />
                        ))}
                      </div>
                      <Music className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-heading font-bold text-memora-black text-center text-sm sm:text-base">
                    {example.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="flex items-center space-x-2 text-memora-gray">
              <Music className="w-5 h-5" />
              <span className="font-medium">
                Prévias de 15 segundos • Músicas completas de até 3 minutos
              </span>
            </div>
            <button 
              className="bg-memora-primary hover:bg-memora-primary/90 text-white font-heading font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              data-attr="examples-cta-button"
            >
              Criar minha música agora
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExamplesGrid;