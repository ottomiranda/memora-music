// Estrutura de dados para gêneros musicais
export interface SubGenre {
  id: string;
  name: string;
  description: string;
}

export interface MusicGenre {
  id: string;
  name: string;
  description: string;
  subGenres: SubGenre[];
}

// Lista completa de gêneros musicais organizados
export const musicGenres: MusicGenre[] = [
  // Gêneros Internacionais
  {
    id: 'rock',
    name: 'Rock',
    description: 'Energético e poderoso',
    subGenres: [
      { id: 'rock-alternativo', name: 'Rock Alternativo', description: 'Moderno e experimental' },
      { id: 'rock-classico', name: 'Rock Clássico', description: 'Atemporal e icônico' },
      { id: 'hard-rock', name: 'Hard Rock', description: 'Pesado e vibrante' },
      { id: 'punk-rock', name: 'Punk Rock', description: 'Rápido e contestador' }
    ]
  },
  {
    id: 'pop',
    name: 'Pop',
    description: 'Cativante e universal',
    subGenres: [
      { id: 'dance-pop', name: 'Dance-pop', description: 'Dançante e envolvente' },
      { id: 'electropop', name: 'Electropop', description: 'Eletrônico e moderno' },
      { id: 'indie-pop', name: 'Indie Pop', description: 'Independente e criativo' },
      { id: 'synth-pop', name: 'Synth-pop', description: 'Sintético e nostálgico' },
      { id: 'k-pop', name: 'K-pop', description: 'Colorido e dinâmico' }
    ]
  },
  {
    id: 'hip-hop',
    name: 'Hip Hop',
    description: 'Urbano e expressivo',
    subGenres: [
      { id: 'hip-hop-alternativo', name: 'Hip Hop Alternativo', description: 'Inovador e consciente' },
      { id: 'gangsta-rap', name: 'Gangsta Rap', description: 'Intenso e direto' },
      { id: 'trap', name: 'Trap', description: 'Pesado e hipnótico' },
      { id: 'drill', name: 'Drill', description: 'Sombrio e agressivo' }
    ]
  },
  {
    id: 'jazz',
    name: 'Jazz',
    description: 'Sofisticado e improvisado',
    subGenres: [
      { id: 'bebop', name: 'Bebop', description: 'Rápido e complexo' },
      { id: 'big-band', name: 'Big Band', description: 'Grandioso e swing' },
      { id: 'cool-jazz', name: 'Cool Jazz', description: 'Suave e relaxante' },
      { id: 'jazz-fusion', name: 'Jazz Fusion', description: 'Moderno e elétrico' }
    ]
  },
  {
    id: 'blues',
    name: 'Blues',
    description: 'Emotivo e autêntico',
    subGenres: [
      { id: 'chicago-blues', name: 'Chicago Blues', description: 'Urbano e elétrico' },
      { id: 'delta-blues', name: 'Delta Blues', description: 'Tradicional e acústico' },
      { id: 'blues-eletrico', name: 'Blues Elétrico', description: 'Amplificado e potente' },
      { id: 'gospel-blues', name: 'Gospel Blues', description: 'Espiritual e tocante' }
    ]
  },
  {
    id: 'country',
    name: 'Country',
    description: 'Narrativo e rural',
    subGenres: [
      { id: 'bluegrass', name: 'Bluegrass', description: 'Acústico e virtuoso' },
      { id: 'country-pop', name: 'Country Pop', description: 'Comercial e acessível' },
      { id: 'country-rock', name: 'Country Rock', description: 'Energético e híbrido' }
    ]
  },
  {
    id: 'eletronica',
    name: 'Eletrônica',
    description: 'Digital e futurista',
    subGenres: [
      { id: 'ambient', name: 'Ambient', description: 'Atmosférico e contemplativo' },
      { id: 'breakbeat', name: 'Breakbeat', description: 'Fragmentado e rítmico' },
      { id: 'disco', name: 'Disco', description: 'Dançante e festivo' },
      { id: 'drum-and-bass', name: 'Drum and Bass', description: 'Rápido e intenso' },
      { id: 'house', name: 'House', description: 'Repetitivo e hipnótico' },
      { id: 'techno', name: 'Techno', description: 'Industrial e mecânico' },
      { id: 'trance', name: 'Trance', description: 'Elevado e transcendente' }
    ]
  },
  {
    id: 'folk',
    name: 'Folk',
    description: 'Tradicional e storytelling',
    subGenres: [
      { id: 'americana', name: 'Americana', description: 'Raízes e contemporâneo' },
      { id: 'celta', name: 'Celta', description: 'Místico e ancestral' },
      { id: 'indie-folk', name: 'Indie Folk', description: 'Moderno e intimista' }
    ]
  },
  {
    id: 'rnb-soul',
    name: 'R&B & Soul',
    description: 'Sensual e emotivo',
    subGenres: [
      { id: 'funk', name: 'Funk', description: 'Groove e dançante' },
      { id: 'gospel', name: 'Gospel', description: 'Espiritual e poderoso' },
      { id: 'neo-soul', name: 'Neo Soul', description: 'Contemporâneo e sofisticado' }
    ]
  },
  {
    id: 'metal',
    name: 'Metal',
    description: 'Pesado e intenso',
    subGenres: [
      { id: 'black-metal', name: 'Black Metal', description: 'Sombrio e extremo' },
      { id: 'death-metal', name: 'Death Metal', description: 'Brutal e técnico' },
      { id: 'heavy-metal', name: 'Heavy Metal', description: 'Clássico e poderoso' }
    ]
  },
  {
    id: 'punk',
    name: 'Punk',
    description: 'Rebelde e direto',
    subGenres: [
      { id: 'punk-anarquista', name: 'Punk Anarquista', description: 'Político e revolucionário' },
      { id: 'hardcore', name: 'Hardcore', description: 'Extremo e agressivo' },
      { id: 'pop-punk', name: 'Pop Punk', description: 'Melódico e acessível' }
    ]
  },
  {
    id: 'easy-listening',
    name: 'Easy Listening',
    description: 'Relaxante e suave',
    subGenres: [
      { id: 'musica-ambiente', name: 'Música Ambiente', description: 'Sutil e envolvente' },
      { id: 'lounge', name: 'Lounge', description: 'Elegante e sofisticado' },
      { id: 'soft-rock', name: 'Soft Rock', description: 'Melódico e gentil' }
    ]
  },
  {
    id: 'avant-garde',
    name: 'Avant-garde & Experimental',
    description: 'Inovador e vanguardista',
    subGenres: [
      { id: 'experimental', name: 'Experimental', description: 'Ousado e único' },
      { id: 'avant-garde', name: 'Avant-garde', description: 'Artístico e conceitual' }
    ]
  },

  // Gêneros Brasileiros
  {
    id: 'mpb',
    name: 'MPB',
    description: 'Brasileira e sofisticada',
    subGenres: [
      { id: 'mpb-classica', name: 'MPB Clássica', description: 'Tradicional e poética' },
      { id: 'mpb-contemporanea', name: 'MPB Contemporânea', description: 'Moderna e inovadora' }
    ]
  },
  {
    id: 'samba',
    name: 'Samba',
    description: 'Alegre e brasileiro',
    subGenres: [
      { id: 'samba-de-raiz', name: 'Samba de Raiz', description: 'Autêntico e tradicional' },
      { id: 'pagode', name: 'Pagode', description: 'Festivo e popular' }
    ]
  },
  {
    id: 'bossa-nova',
    name: 'Bossa Nova',
    description: 'Elegante e intimista',
    subGenres: [
      { id: 'bossa-nova-classica', name: 'Bossa Nova Clássica', description: 'Suave e refinada' },
      { id: 'bossa-nova-moderna', name: 'Bossa Nova Moderna', description: 'Contemporânea e estilizada' }
    ]
  },
  {
    id: 'forro',
    name: 'Forró',
    description: 'Dançante e nordestino',
    subGenres: [
      { id: 'forro-pe-de-serra', name: 'Forró Pé-de-Serra', description: 'Tradicional e sanfona' },
      { id: 'forro-universitario', name: 'Forró Universitário', description: 'Moderno e romântico' }
    ]
  },
  {
    id: 'sertanejo',
    name: 'Sertanejo',
    description: 'Popular e emotivo',
    subGenres: [
      { id: 'sertanejo-raiz', name: 'Sertanejo Raiz', description: 'Tradicional e rural' },
      { id: 'sertanejo-universitario', name: 'Sertanejo Universitário', description: 'Comercial e romântico' }
    ]
  },
  {
    id: 'axe',
    name: 'Axé',
    description: 'Festivo e baiano',
    subGenres: [
      { id: 'axe-classico', name: 'Axé Clássico', description: 'Carnavalesco e energético' },
      { id: 'axe-pop', name: 'Axé Pop', description: 'Comercial e dançante' }
    ]
  },
  {
    id: 'funk-carioca',
    name: 'Funk Carioca',
    description: 'Urbano e carioca',
    subGenres: [
      { id: 'funk-melody', name: 'Funk Melody', description: 'Melódico e romântico' },
      { id: 'funk-ostentacao', name: 'Funk Ostentação', description: 'Luxuoso e aspiracional' }
    ]
  },
  {
    id: 'tropicalia',
    name: 'Tropicália',
    description: 'Revolucionária e antropofágica',
    subGenres: [
      { id: 'tropicalia-classica', name: 'Tropicália Clássica', description: 'Experimental e cultural' },
      { id: 'neo-tropicalia', name: 'Neo-Tropicália', description: 'Contemporânea e conceitual' }
    ]
  },
  {
    id: 'choro',
    name: 'Choro',
    description: 'Virtuoso e instrumental',
    subGenres: [
      { id: 'choro-tradicional', name: 'Choro Tradicional', description: 'Clássico e técnico' },
      { id: 'choro-moderno', name: 'Choro Moderno', description: 'Inovador e fusion' }
    ]
  }
];

// Função utilitária para buscar gêneros
export const searchGenres = (query: string): MusicGenre[] => {
  const lowercaseQuery = query.toLowerCase();
  return musicGenres.filter(genre => 
    genre.name.toLowerCase().includes(lowercaseQuery) ||
    genre.description.toLowerCase().includes(lowercaseQuery) ||
    genre.subGenres.some(sub => 
      sub.name.toLowerCase().includes(lowercaseQuery) ||
      sub.description.toLowerCase().includes(lowercaseQuery)
    )
  );
};

// Função para obter todos os subgêneros como lista plana
export const getAllSubGenres = (): SubGenre[] => {
  return musicGenres.flatMap(genre => genre.subGenres);
};

// Função para encontrar gênero por ID
export const findGenreById = (id: string): MusicGenre | undefined => {
  return musicGenres.find(genre => genre.id === id);
};

// Função para encontrar subgênero por ID
export const findSubGenreById = (id: string): { genre: MusicGenre; subGenre: SubGenre } | undefined => {
  for (const genre of musicGenres) {
    const subGenre = genre.subGenres.find(sub => sub.id === id);
    if (subGenre) {
      return { genre, subGenre };
    }
  }
  return undefined;
};