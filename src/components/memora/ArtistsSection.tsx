import { Play, Lock } from "lucide-react";

const ArtistsSection = () => {
  const artists = [
    {
      id: "ana-silva",
      name: "Ana Silva",
      avatar: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20singer%20portrait%20warm%20smile%20studio%20lighting%20musical%20artist&image_size=square",
      styles: ["Pop", "Romântico"],
      description: "Voz suave e envolvente"
    },
    {
      id: "carlos-mendes",
      name: "Carlos Mendes",
      avatar: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20male%20singer%20portrait%20confident%20expression%20studio%20lighting%20musical%20artist&image_size=square",
      styles: ["Sertanejo", "Country"],
      description: "Timbre marcante e emotivo"
    },
    {
      id: "lucia-santos",
      name: "Lúcia Santos",
      avatar: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20vocalist%20elegant%20portrait%20warm%20lighting%20musical%20performer&image_size=square",
      styles: ["MPB", "Bossa Nova"],
      description: "Interpretação sofisticada"
    },
    {
      id: "pedro-costa",
      name: "Pedro Costa",
      avatar: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20male%20vocalist%20friendly%20smile%20studio%20portrait%20musical%20artist&image_size=square",
      styles: ["Rock", "Pop Rock"],
      description: "Energia e versatilidade"
    },
    {
      id: "maria-oliveira",
      name: "Maria Oliveira",
      avatar: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20singer%20gentle%20expression%20warm%20studio%20lighting%20musical%20talent&image_size=square",
      styles: ["Infantil", "Família"],
      description: "Doçura e carinho na voz"
    },
    {
      id: "rafael-lima",
      name: "Rafael Lima",
      avatar: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20male%20singer%20charismatic%20portrait%20studio%20lighting%20musical%20performer&image_size=square",
      styles: ["Funk", "R&B"],
      description: "Groove e personalidade"
    }
  ];

  return (
    <section id="artistas" className="py-20 bg-memora-gray-light/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-memora-black mb-4">
            Artistas que dão voz às suas memórias
          </h2>
          <p className="text-xl text-memora-gray max-w-4xl mx-auto">
            A IA cria a base e você poderá escolher versões cantadas por artistas reais nas próximas etapas.
          </p>
        </div>

        {/* Artists Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {artists.map((artist) => (
            <div
              key={artist.id}
              className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              {/* Coming Soon Badge */}
              <div className="absolute top-4 right-4 bg-memora-secondary/10 text-memora-secondary px-3 py-1 rounded-full text-xs font-bold">
                Em breve
              </div>

              {/* Avatar */}
              <div className="relative mb-4">
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden ring-4 ring-transparent group-hover:ring-memora-turquoise/30 transition-all duration-300">
                  <img
                    src={artist.avatar}
                    alt={`Foto do artista ${artist.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Artist Info */}
              <div className="text-center mb-4">
                <h3 className="text-xl font-heading font-bold text-memora-black mb-2">
                  {artist.name}
                </h3>
                <p className="text-memora-gray text-sm mb-3">
                  {artist.description}
                </p>
                
                {/* Styles */}
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {artist.styles.map((style, index) => (
                    <span
                      key={index}
                      className="bg-memora-primary/10 text-memora-primary px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample Button (Disabled) */}
              <div className="text-center">
                <button
                  disabled
                  className="w-full bg-memora-gray/20 text-memora-gray cursor-not-allowed font-heading font-bold py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-2"
                  aria-label={`Ouvir amostra de ${artist.name} - Em breve`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Ouvir amostra</span>
                </button>
              </div>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-memora-turquoise/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Bottom Info */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-4 bg-white px-8 py-4 rounded-2xl shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-memora-secondary rounded-full animate-pulse" />
              <span className="text-memora-black font-medium">
                Funcionalidade em desenvolvimento
              </span>
            </div>
            <div className="w-px h-6 bg-memora-gray/30" />
            <span className="text-memora-gray text-sm">
              Versões com artistas reais estarão disponíveis em breve
            </span>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-12 grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-memora-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Play className="w-6 h-6 text-memora-primary" />
            </div>
            <h4 className="font-heading font-bold text-memora-black mb-1">
              Múltiplas Versões
            </h4>
            <p className="text-sm text-memora-gray">
              Escolha entre diferentes interpretações da sua música
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-memora-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-memora-secondary" />
            </div>
            <h4 className="font-heading font-bold text-memora-black mb-1">
              Qualidade Profissional
            </h4>
            <p className="text-sm text-memora-gray">
              Gravações em estúdio com artistas experientes
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-memora-turquoise/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Play className="w-6 h-6 text-memora-turquoise" />
            </div>
            <h4 className="font-heading font-bold text-memora-black mb-1">
              Estilos Variados
            </h4>
            <p className="text-sm text-memora-gray">
              Do sertanejo ao pop, encontre o estilo perfeito
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArtistsSection;