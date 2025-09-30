import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button';
  lines?: number;
}

export function Skeleton({ 
  className, 
  variant = 'default', 
  lines = 1,
  ...props 
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded';
  
  const variants = {
    default: 'h-4 w-full',
    card: 'h-48 w-full rounded-lg',
    text: 'h-4',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24 rounded-md'
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              variants.text,
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, variants[variant], className)}
      {...props}
    />
  );
}

// Skeleton específico para cards de exemplo
export function ExampleCardSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 xs:p-6 space-y-4">
      <div className="flex items-center space-x-3">
        <Skeleton variant="avatar" className="h-8 w-8" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton variant="card" className="h-32" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-16" />
        <Skeleton variant="button" className="h-8 w-20" />
      </div>
    </div>
  );
}

// Skeleton para seção Hero
export function HeroSkeleton() {
  return (
    <div className="text-center space-y-6 py-12">
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4 mx-auto" />
        <Skeleton className="h-12 w-2/3 mx-auto" />
      </div>
      <div className="space-y-2 max-w-2xl mx-auto">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5 mx-auto" />
      </div>
      <div className="flex flex-col xs:flex-row gap-4 justify-center">
        <Skeleton variant="button" className="h-12 w-32" />
        <Skeleton variant="button" className="h-12 w-28" />
      </div>
    </div>
  );
}

// Skeleton para timeline do HowItWorks
export function TimelineSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton variant="avatar" className="h-10 w-10" />
            {i < 3 && <Skeleton className="w-0.5 h-16 mt-2" />}
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton variant="text" lines={2} />
          </div>
        </div>
      ))}
    </div>
  );
}