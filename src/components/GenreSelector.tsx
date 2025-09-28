import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, ChevronLeft, Music, Globe, MapPin, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { musicGenres, type MusicGenre, type SubGenre } from '@/data/musicGenres';
import { useMusicStore } from '@/store/musicStore';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface GenreSelectorProps {
  onGenreSelect?: (genreId: string, subGenreId?: string) => void;
  selectedGenre?: string;
  selectedSubGenre?: string;
  className?: string;
}

export default function GenreSelector({
  onGenreSelect,
  selectedGenre,
  selectedSubGenre,
  className = '',
}: GenreSelectorProps) {
  const { t } = useTranslation('common');
  const { updateFormData } = useMusicStore();
  const [selectedSubGenres, setSelectedSubGenres] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'brazilian' | 'international'>('brazilian');
  const [showSubGenres, setShowSubGenres] = useState(false);
  const [currentGenre, setCurrentGenre] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'genres' | 'subgenres'>('genres');
  const [internalSelectedGenre, setInternalSelectedGenre] = useState<string | null>(selectedGenre || null);
  const [selectedMainGenre, setSelectedMainGenre] = useState<MusicGenre | null>(null);
  const [internalSelectedSubGenre, setInternalSelectedSubGenre] = useState<string | null>(selectedSubGenre || null);

  // Debug logs
  console.log('GenreSelector - musicGenres:', musicGenres)
  console.log('GenreSelector - musicGenres length:', musicGenres.length)

  // Filtrar gêneros baseado na busca, suportando traduções
  const filteredGenres = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (!trimmedQuery) return musicGenres;

    const matchesQuery = (value?: string | null) =>
      typeof value === 'string' && value.toLowerCase().includes(trimmedQuery);

    return musicGenres.filter((genre) => {
      const translatedGenreDescription = t(`genreSelector.genreDescriptions.${genre.id}`, {
        defaultValue: genre.description,
      });

      const genreMatches = [
        genre.name,
        genre.description,
        translatedGenreDescription,
      ].some(matchesQuery);

      if (genreMatches) return true;

      return genre.subGenres.some((subGenre) => {
        const translatedSubDescription = t(`genreSelector.subGenreDescriptions.${subGenre.id}`, {
          defaultValue: subGenre.description,
        });

        return [
          subGenre.name,
          subGenre.description,
          translatedSubDescription,
        ].some(matchesQuery);
      });
    });
  }, [searchQuery, t]);

  // Separar gêneros brasileiros e internacionais
  const { brazilianGenres, internationalGenres } = useMemo(() => {
    const brazilian = filteredGenres.filter(genre => 
      ['mpb', 'samba', 'bossa-nova', 'forro', 'sertanejo', 'axe', 'frevo', 'baiao', 'choro', 'tropicalia', 'funk-carioca'].includes(genre.id)
    );
    const international = filteredGenres.filter(genre => 
      !['mpb', 'samba', 'bossa-nova', 'forro', 'sertanejo', 'axe', 'frevo', 'baiao', 'choro', 'tropicalia', 'funk-carioca'].includes(genre.id)
    );

    return { brazilianGenres: brazilian, internationalGenres: international };
  }, [filteredGenres]);

  const handleGenreClick = (genre: MusicGenre) => {
    setInternalSelectedGenre(genre.id);
    if (genre.subGenres.length > 0) {
      setSelectedMainGenre(genre);
      setCurrentView('subgenres');
      // Limpar subgênero selecionado ao trocar de gênero
      setInternalSelectedSubGenre(null);
    } else {
      // Gênero sem subgêneros - seleção direta
      updateFormData({ genre: genre.name });
      onGenreSelect?.(genre.id);
      setInternalSelectedSubGenre(null);
    }
  };

  const handleSubGenreClick = (subGenre: SubGenre) => {
    if (selectedMainGenre) {
      setInternalSelectedSubGenre(subGenre.id);
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

  const getGenreDescription = (genre: MusicGenre) =>
    t(`genreSelector.genreDescriptions.${genre.id}`, {
      defaultValue: genre.description,
    });

  const getSubGenreDescription = (subGenre: SubGenre) =>
    t(`genreSelector.subGenreDescriptions.${subGenre.id}`, {
      defaultValue: subGenre.description,
    });

  const GenreCard: React.FC<{ genre: MusicGenre; isSelected?: boolean }> = ({ genre, isSelected }) => (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl cursor-pointer group",
        "transition-all duration-700 ease-out",
        "hover:scale-[1.02]"
      )}
      onClick={() => handleGenreClick(genre)}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleGenreClick(genre);
        }
      }}
    >
      {/* Glassmorphism background layer */}
      <div className={cn(
        "absolute inset-0 rounded-2xl",
        "bg-gradient-to-br from-white/20 via-white/10 to-white/5",
        "backdrop-blur-xl border border-white/20",
        "shadow-2xl shadow-black/10",
        "transition-all duration-700 ease-out",
        "group-hover:shadow-3xl group-hover:shadow-black/20",
        "group-hover:border-white/30",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-transparent",
        "before:opacity-0 before:transition-opacity before:duration-300",
        "group-hover:before:opacity-100",
        isSelected && [
          "ring-2 ring-purple-400/80 shadow-purple-400/20",
          "bg-gradient-to-br from-purple-500/30 via-purple-400/20 to-purple-300/10",
          "border-purple-400/50",
          "shadow-2xl shadow-purple-500/20"
        ]
      )} />
      
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-purple-500/4 to-pink-500/8 transition-opacity duration-500 group-hover:opacity-50 z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_70%)] transition-opacity duration-500 group-hover:opacity-40 z-0" />
      
      {/* Hover backdrop blur effect */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/3 opacity-0 group-hover:opacity-60 transition-all duration-500 rounded-2xl z-0" />
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/15 via-purple-400/15 to-pink-400/15 opacity-0 group-hover:opacity-70 transition-opacity duration-500 blur-sm z-0" />
      
      <div className="relative z-20 flex flex-col space-y-3 p-6">
        <div className="flex items-center justify-between">
          <h3 className={cn(
            "font-medium text-base leading-tight drop-shadow-sm transition-all duration-500 group-hover:drop-shadow-xl",
            isSelected ? "text-purple-100 font-semibold" : "text-white group-hover:text-white/95"
          )}>
            {genre.name}
          </h3>
          {isSelected && (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-400/80 backdrop-blur-sm">
              <Check className="h-3 w-3 text-white flex-shrink-0" />
            </div>
          )}
        </div>
        <p className="text-sm text-white/80 leading-relaxed line-clamp-2">
          {getGenreDescription(genre)}
        </p>
        {genre.subGenres && genre.subGenres.length > 0 && (
          <div className="flex items-center text-xs text-white/60 pt-1">
            <span>{t('genreSelector.stylesCount', { count: genre.subGenres.length })}</span>
          </div>
        )}
      </div>
    </div>
  );

  const SubGenreCard: React.FC<{ subGenre: SubGenre; isSelected?: boolean }> = ({ subGenre, isSelected }) => (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl cursor-pointer group",
        "transition-all duration-700 ease-out",
        "hover:scale-[1.02]"
      )}
      onClick={() => handleSubGenreClick(subGenre)}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSubGenreClick(subGenre);
        }
      }}
    >
      {/* Glassmorphism background layer */}
      <div className={cn(
        "absolute inset-0 rounded-2xl",
        "bg-gradient-to-br from-white/20 via-white/10 to-white/5",
        "backdrop-blur-xl border border-white/20",
        "shadow-2xl shadow-black/10",
        "transition-all duration-700 ease-out",
        "group-hover:shadow-3xl group-hover:shadow-black/20",
        "group-hover:border-white/30",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-transparent",
        "before:opacity-0 before:transition-opacity before:duration-300",
        "group-hover:before:opacity-100",
        isSelected && [
          "ring-2 ring-amber-400/80 shadow-amber-400/20",
          "bg-gradient-to-br from-amber-500/30 via-yellow-400/20 to-amber-300/10",
          "border-amber-400/50",
          "shadow-2xl shadow-amber-500/20"
        ]
      )} />
      
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 transition-opacity duration-700 group-hover:opacity-80 z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)] transition-opacity duration-700 group-hover:opacity-60 z-0" />
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm z-0" />
      
      <div className="relative z-20 p-6 h-full">
        <div className="flex flex-col justify-center h-full min-h-[70px] space-y-2">
          <div className="flex items-center justify-between">
            <h4 className={cn(
              "font-heading font-medium text-base leading-tight line-clamp-2 drop-shadow-sm transition-all duration-500 group-hover:drop-shadow-xl",
              isSelected ? "text-amber-100 font-semibold" : "text-white group-hover:text-white/95"
            )}>
              {subGenre.name}
            </h4>
            {isSelected && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-400/80 backdrop-blur-sm ml-2">
                <Check className="h-3 w-3 text-white flex-shrink-0" />
              </div>
            )}
          </div>
          <p className={cn(
            "text-sm leading-relaxed line-clamp-3 transition-colors duration-300",
            isSelected ? "text-blue-100/90" : "text-white/80"
          )}>
            {getSubGenreDescription(subGenre)}
          </p>
        </div>
       </div>
     </div>
   );

  const GenreSection: React.FC<{ title: string; genres: MusicGenre[]; icon: string }> = ({ title, genres, icon }) => {
    if (genres.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-heading font-semibold text-white">{title}</h3>
          <Badge variant="outline" className="text-white border-white/30">{genres.length}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {genres.map((genre) => (
            <GenreCard 
              key={genre.id} 
              genre={genre} 
              isSelected={internalSelectedGenre === genre.id}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <div className="group relative w-full max-w-4xl mx-auto overflow-hidden rounded-2xl transition-all duration-700 ease-out bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/10 hover:shadow-3xl hover:shadow-black/20 hover:border-white/30">
        {/* Hover overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-0" />
        
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 transition-opacity duration-700 group-hover:opacity-80 z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)] transition-opacity duration-700 group-hover:opacity-60 z-0" />
        
        {/* Animated border glow */}
        <div className="absolute -inset-px bg-gradient-to-r from-amber-400/20 via-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm rounded-2xl z-0" />
        
        <div className="relative z-20 p-8 pb-6">
          {/* Header apenas para subgêneros */}
          {currentView === 'subgenres' && (
            <div className="flex items-center space-x-2 mb-8">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToGenres}
                className="mr-2 text-white/80 hover:text-white hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Music className="h-6 w-6 text-purple-300" />
              <h2 className="text-xl font-heading font-semibold text-white">
                {t('genreSelector.subgenresTitle', { genreName: selectedMainGenre?.name ?? '' })}
              </h2>
              {/* Badge do subgênero selecionado */}
              {internalSelectedSubGenre && selectedMainGenre && (
                <div className="ml-3">
                  <Badge 
                    variant="secondary" 
                    className="bg-gradient-to-r from-amber-500/80 to-yellow-500/80 text-white border-amber-400/50 backdrop-blur-sm shadow-lg"
                  >
                    <Music className="h-3 w-3 mr-1" />
                    {selectedMainGenre.subGenres.find(sg => sg.id === internalSelectedSubGenre)?.name}
                  </Badge>
                </div>
              )}
            </div>
          )}
          
          {/* Campo de busca para gêneros */}
          {currentView === 'genres' && (
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input
                placeholder={t('genreSelector.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/15 focus:border-white/40"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
                >
                  ×
                </Button>
              )}
            </div>
          )}
        </div>
        
        <div className="px-8 pb-8">
          <ScrollArea className="h-[600px] pr-4">
            {currentView === 'genres' ? (
              <div className="space-y-8">
                {searchQuery ? (
                  // Resultados da busca
                  <div className="space-y-3">
                    <h3 className="text-lg font-heading font-semibold text-white">
                      {t('genreSelector.searchResults', { count: filteredGenres.length })}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {filteredGenres.map((genre) => (
                        <GenreCard 
                          key={genre.id} 
                          genre={genre} 
                          isSelected={internalSelectedGenre === genre.id}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  // Visualização por categorias com abas
                  <Tabs defaultValue="brasileiros" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white/10 border-white/20 mt-2">
                      <TabsTrigger value="brasileiros" className="flex items-center gap-2 text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/20">
                        <MapPin className="w-4 h-4" />
                        {t('genreSelector.brazilianGenres')}
                      </TabsTrigger>
                      <TabsTrigger value="internacionais" className="flex items-center gap-2 text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/20">
                        <Globe className="w-4 h-4" />
                        {t('genreSelector.internationalGenres')}
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="brasileiros" className="mt-6">
                      <GenreSection 
                        title={t('genreSelector.brazilianGenres')} 
                        genres={brazilianGenres} 
                        icon="🇧🇷" 
                      />
                    </TabsContent>
                    
                    <TabsContent value="internacionais" className="mt-6">
                      <GenreSection 
                        title={t('genreSelector.internationalGenres')} 
                        genres={internationalGenres} 
                        icon="🌍" 
                      />
                    </TabsContent>
                  </Tabs>
                )}
                
                {filteredGenres.length === 0 && (
                  <div className="text-center py-12">
                    <Music className="h-12 w-12 text-white/30 mx-auto mb-4" />
                    <p className="text-white/60">{t('genreSelector.noGenresFound', { searchQuery })}</p>
                    <Button variant="outline" onClick={clearSearch} className="mt-2 border-white/30 text-white hover:bg-white/10">
                      {t('genreSelector.clearSearch')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              // Visualização de subgêneros
              <div className="space-y-4">
                {selectedMainGenre && (
                  <>
                  <div className="bg-gradient-to-r from-purple-100/20 to-pink-100/20 p-4 rounded-lg border border-white/20 backdrop-blur-sm">
                    <h3 className="font-heading font-semibold text-white">{selectedMainGenre.name}</h3>
                    <p className="text-sm text-white/70">{getGenreDescription(selectedMainGenre)}</p>
                  </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {selectedMainGenre.subGenres.map((subGenre) => (
                        <SubGenreCard 
                          key={subGenre.id} 
                          subGenre={subGenre} 
                          isSelected={internalSelectedSubGenre === subGenre.id}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
