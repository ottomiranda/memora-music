import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Artist, ArtistFilter, ArtistResponse } from '@/types/artist';
import { LazyImage } from '@/hooks/useLazyLoading';

interface ArtistsSectionProps {
  initialFilter?: ArtistFilter;
  onArtistClick?: (artist: Artist) => void;
}

export const ArtistsSection: React.FC<ArtistsSectionProps> = ({
  initialFilter,
  onArtistClick
}) => {
  const [filter, setFilter] = useState<ArtistFilter>(initialFilter || {
    sortBy: 'monthlyListeners',
    sortOrder: 'desc',
    limit: 12,
    offset: 0
  });

  const { data, isLoading, error } = useQuery<ArtistResponse>({
    queryKey: ['artists', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.genre) params.append('genre', filter.genre);
      if (filter.search) params.append('search', filter.search);
      if (filter.sortBy) params.append('sortBy', filter.sortBy);
      if (filter.sortOrder) params.append('sortOrder', filter.sortOrder);
      if (filter.limit) params.append('limit', filter.limit.toString());
      if (filter.offset) params.append('offset', filter.offset.toString());

      const response = await fetch(`/api/artists?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch artists');
      }
      return response.json();
    }
  });

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(prev => ({
      ...prev,
      search: event.target.value,
      offset: 0
    }));
  };

  const handleGenreFilter = (genre: string) => {
    setFilter(prev => ({
      ...prev,
      genre: prev.genre === genre ? undefined : genre,
      offset: 0
    }));
  };

  const handleSort = (sortBy: ArtistFilter['sortBy']) => {
    setFilter(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      offset: 0
    }));
  };

  const handleLoadMore = () => {
    setFilter(prev => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 12)
    }));
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        Error loading artists. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="search"
          placeholder="Search artists..."
          className="px-4 py-2 border rounded-lg"
          value={filter.search || ''}
          onChange={handleSearch}
        />
        
        <div className="flex gap-2">
          {['Pop', 'Rock', 'Hip Hop', 'Electronic'].map(genre => (
            <button
              key={genre}
              className={`px-4 py-2 rounded-lg ${
                filter.genre === genre
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => handleGenreFilter(genre)}
            >
              {genre}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          {[
            { label: 'Monthly Listeners', value: 'monthlyListeners' },
            { label: 'Followers', value: 'followers' },
            { label: 'Total Plays', value: 'totalPlays' }
          ].map(sort => (
            <button
              key={sort.value}
              className={`px-4 py-2 rounded-lg ${
                filter.sortBy === sort.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => handleSort(sort.value as ArtistFilter['sortBy'])}
            >
              {sort.label}
              {filter.sortBy === sort.value && (
                <span className="ml-1">
                  {filter.sortOrder === 'desc' ? '↓' : '↑'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data?.data.map(artist => (
          <div
            key={artist.id}
            className="group relative overflow-hidden rounded-lg cursor-pointer"
            onClick={() => onArtistClick?.(artist)}
          >
            <LazyImage
              src={artist.image || '/placeholder-artist.jpg'}
              alt={artist.name}
              className="w-full h-64 object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4 text-white">
              <h3 className="text-xl font-bold">{artist.name}</h3>
              {artist.stats && (
                <div className="text-sm opacity-80">
                  {artist.stats.monthlyListeners?.toLocaleString()} monthly listeners
                </div>
              )}
              {artist.genres && artist.genres.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {artist.genres.slice(0, 2).map(genre => (
                    <span
                      key={genre}
                      className="px-2 py-1 bg-white/20 rounded-full text-xs"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {data && data.total > (filter.offset || 0) + (filter.limit || 12) && (
        <div className="text-center mt-8">
          <button
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
            onClick={handleLoadMore}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};