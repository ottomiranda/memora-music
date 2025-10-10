import { memo } from 'react';
import { useComponentCache } from "@/hooks/useComponentCache";

const FloatingElements = memo(() => {
  const { component } = useComponentCache(
    'hero-floating-elements',
    () => (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-primary rounded-full opacity-60 float-gentle"></div>
        <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-accent-coral rounded-full opacity-40 float-gentle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/5 w-3 h-3 bg-accent-turquoise rounded-full opacity-70 float-gentle" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-5 h-5 bg-secondary rounded-full opacity-50 float-gentle" style={{ animationDelay: '0.5s' }}></div>
      </div>
    ),
    {
      ttl: 15 * 60 * 1000, // 15 minutes - static content
      enableMemoryCache: true,
    }
  );
  
  return component;
});

FloatingElements.displayName = 'FloatingElements';

export default FloatingElements;