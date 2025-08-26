import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, ChevronLeft, Music } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { musicGenres, searchGenres, type MusicGenre, type SubGenre } from '@/data/musicGenres';
import { useMusicStore } from '@/store/musicStore';

interface GenreSelectorProps {
  onGenreSelect?: (genreId: string, subGenreId?: string) => void;
  selectedGenre?: string;
  selectedSubGenre?: string;
  className?: string;
}

export const GenreSelector: React.FC<GenreSelectorProps> = ({
  onGenreSelect,
  selectedGenre,
  selectedSubGenre,
  className = ''
}) => {
  const { updateFormData } = useMusicStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMainGenre, setSelectedMainGenre] = useState<MusicGenre | null>(null);
  const [currentView, setCurrentView] = useState<'genres' | 'subgenres'>('genres');

  // Debug logs
  console.log('GenreSelector - musicGenres:', musicGenres)
  console.log('GenreSelector - musicGenres length:', musicGenres.length)

  // Filtrar gêneros baseado na busca
  const filteredGenres = useMemo(() => {
    if (!searchQuery.trim()) return musicGenres;
    return searchGenres(searchQuery);
  }, [searchQuery]);

  // Separar gêneros brasileiros e internacionais
  const { brazilianGenres, internationalGenres } = useMemo(() => {
    const brazilian = filteredGenres.filter(genre => 
      ['mpb', 'samba', 'bossa-nova', 'forro', 'sertanejo', 'axe', 'frevo', 'baiao', 'choro', 'tropicalia', 'funk-carioca'].includes(genre.id)
    );
    const international = filteredGenres.filter(genre => 
      !['mpb', 'samba', 'bossa-nova', 'forro', 'sertanejo', 'axe', 'frevo', 'baiao', 'choro', 'tropicalia', 'funk-carioca'].includes(genre.id)
    );



    return { brazilianGenres: brazilian, internationalGenres: international };
  }, [filteredGenres, searchQuery, currentView]);

  const handleGenreClick = (genre: MusicGenre) => {
    if (genre.subGenres.length > 0) {
      setSelectedMainGenre(genre);
      setCurrentView('subgenres');
    } else {
      // Gênero sem subgêneros - seleção direta
      updateFormData({ genre: genre.name });
      onGenreSelect?.(genre.id);
    }
  };

  const handleSubGenreClick = (subGenre: SubGenre) => {
    if (selectedMainGenre) {
      const fullGenreName = `${selectedMainGenre.name} - ${subGenre.name}`;
      updateFormData({ genre: fullGenreName });
      onGenreSelect?.(selectedMainGenre.id, subGenre.id);
    }
  };

  const handleBackToGenres = () => {
    setCurrentView('genres');
    setSelectedMainGenre(null);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const GenreCard: React.FC<{ genre: MusicGenre; isSelected?: boolean }> = ({ genre, isSelected }) => (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={() => handleGenreClick(genre)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Music className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{genre.name}</h3>
              <p className="text-sm text-gray-600">{genre.description}</p>
            </div>
          </div>
          {genre.subGenres.length > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {genre.subGenres.length} estilos
              </Badge>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const SubGenreCard: React.FC<{ subGenre: SubGenre; isSelected?: boolean }> = ({ subGenre, isSelected }) => (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={() => handleSubGenreClick(subGenre)}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
            <Music className="h-4 w-4 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{subGenre.name}</h4>
            <p className="text-sm text-gray-600">{subGenre.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const GenreSection: React.FC<{ title: string; genres: MusicGenre[]; icon: string }> = ({ title, genres, icon }) => {
    if (genres.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <Badge variant="outline">{genres.length}</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {genres.map((genre) => (
            <GenreCard 
              key={genre.id} 
              genre={genre} 
              isSelected={selectedGenre === genre.id}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              {currentView === 'subgenres' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToGenres}
                  className="mr-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <Music className="h-6 w-6 text-purple-600" />
              <span>
                {currentView === 'genres' 
                  ? 'Escolha o Estilo Musical' 
                  : `${selectedMainGenre?.name} - Subgêneros`
                }
              </span>
            </CardTitle>
            {currentView === 'genres' && (
              <Badge variant="secondary">
                {filteredGenres.length} gêneros disponíveis
              </Badge>
            )}
          </div>
          
          {currentView === 'genres' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por gênero ou estilo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  ×
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {currentView === 'genres' ? (
              <div className="space-y-8">
                {searchQuery ? (
                  // Resultados da busca
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Resultados da busca ({filteredGenres.length})
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      {filteredGenres.map((genre) => (
                        <GenreCard 
                          key={genre.id} 
                          genre={genre} 
                          isSelected={selectedGenre === genre.id}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  // Visualização por categorias
                  <>
                    <GenreSection 
                      title="Gêneros Brasileiros" 
                      genres={brazilianGenres} 
                      icon="🇧🇷" 
                    />
                    <GenreSection 
                      title="Gêneros Internacionais" 
                      genres={internationalGenres} 
                      icon="🌍" 
                    />
                  </>
                )}
                
                {filteredGenres.length === 0 && (
                  <div className="text-center py-12">
                    <Music className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum gênero encontrado para "{searchQuery}"</p>
                    <Button variant="outline" onClick={clearSearch} className="mt-2">
                      Limpar busca
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              // Visualização de subgêneros
              <div className="space-y-4">
                {selectedMainGenre && (
                  <>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border">
                      <h3 className="font-semibold text-gray-900">{selectedMainGenre.name}</h3>
                      <p className="text-sm text-gray-600">{selectedMainGenre.description}</p>
                    </div>
                    
                    <div className="grid gap-3 md:grid-cols-2">
                      {selectedMainGenre.subGenres.map((subGenre) => (
                        <SubGenreCard 
                          key={subGenre.id} 
                          subGenre={subGenre} 
                          isSelected={selectedSubGenre === subGenre.id}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenreSelector;