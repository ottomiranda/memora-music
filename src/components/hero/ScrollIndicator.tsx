import { memo } from 'react';
import { useComponentCache } from "@/hooks/useComponentCache";

const ScrollIndicator = memo(() => {
  const { component } = useComponentCache(
    'hero-scroll-indicator',
    () => (
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    ),
    {
      ttl: 20 * 60 * 1000, // 20 minutes - static indicator
      enableMemoryCache: true,
    }
  );
  
  return component;
});

ScrollIndicator.displayName = 'ScrollIndicator';

export default ScrollIndicator;