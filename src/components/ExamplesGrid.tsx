import React from 'react';
import { ExampleGridProps, Example } from '@/types/example';
import { LazyImage } from '@/hooks/useLazyLoading';

const ExampleCard: React.FC<{ example: Example; onClick?: () => void }> = ({
  example,
  onClick
}) => (
  <div
    className="group relative overflow-hidden rounded-lg cursor-pointer"
    onClick={onClick}
  >
    <LazyImage
      src={example.image || example.song.coverImage || '/placeholder-example.jpg'}
      alt={example.title}
      className="w-full h-48 object-cover transition-transform group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4 text-white">
      <h3 className="text-lg font-bold">{example.title}</h3>
      <div className="text-sm opacity-80">{example.artist.name}</div>
      {example.stats && (
        <div className="flex gap-4 mt-2 text-sm opacity-80">
          <span>{example.stats.plays.toLocaleString()} plays</span>
          <span>{example.stats.likes.toLocaleString()} likes</span>
        </div>
      )}
      {example.tags && example.tags.length > 0 && (
        <div className="flex gap-2 mt-2">
          {example.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-white/20 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
);

export const ExamplesGrid: React.FC<ExampleGridProps> = ({
  examples,
  loading,
  error,
  onExampleClick,
  onLoadMore,
  hasMore
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-48"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        Error loading examples: {error.message}
      </div>
    );
  }

  if (!examples || examples.length === 0) {
    return (
      <div className="text-center text-gray-500">
        No examples found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {examples.map(example => (
          <ExampleCard
            key={example.id}
            example={example}
            onClick={() => onExampleClick?.(example)}
          />
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <button
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
            onClick={onLoadMore}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};