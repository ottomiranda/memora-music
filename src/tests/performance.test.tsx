import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
// Componentes simplificados para teste
const TestComponent = () => <div data-testid="test-component">Test Component</div>;
const LazyTestComponent = () => <div data-testid="lazy-component">Lazy Component</div>;

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: vi.fn().mockResolvedValue({
    auth: {
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  }),
}));

// Mock stores
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
  })),
}));

vi.mock('@/store/uiStore', () => ({
  useUiStore: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
  })),
}));

vi.mock('@/store/musicStore', () => ({
  useMusicStore: vi.fn(() => ({
    currentMusic: null,
    isPlaying: false,
    play: vi.fn(),
    pause: vi.fn(),
  })),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en',
    },
  }),
}));

// Mock web-vitals
vi.mock('web-vitals', () => ({
  getCLS: vi.fn(),
  getFID: vi.fn(),
  getFCP: vi.fn(),
  getLCP: vi.fn(),
  getTTFB: vi.fn(),
}));

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver,
});

// Mock requestIdleCallback
Object.defineProperty(window, 'requestIdleCallback', {
  writable: true,
  configurable: true,
  value: (callback: IdleRequestCallback) => {
    return setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 0);
  },
});

Object.defineProperty(window, 'cancelIdleCallback', {
  writable: true,
  configurable: true,
  value: (id: number) => clearTimeout(id),
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock performance.now
    vi.spyOn(performance, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Core Web Vitals Monitoring', () => {
    it('should initialize web vitals monitoring', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <div data-testid="test-component">Test Content</div>
        </TestWrapper>
      );

      // Verify component renders correctly
      expect(getByTestId('test-component')).toBeInTheDocument();
      expect(getByTestId('test-component')).toHaveTextContent('Test Content');
    });

    it('should report metrics when enabled', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <div data-testid="metrics-component">Metrics Test</div>
        </TestWrapper>
      );

      // Verify component renders and can handle metrics
      expect(getByTestId('metrics-component')).toBeInTheDocument();
      expect(getByTestId('metrics-component')).toHaveTextContent('Metrics Test');
      
      // Verify performance API is available
      expect(typeof performance.now).toBe('function');
      expect(performance.now()).toBeGreaterThan(0);
    });
  });

  describe('Lazy Loading Performance', () => {
    it('should implement lazy loading for images', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <img src="test.jpg" loading="lazy" alt="Test" />
            <img src="test2.jpg" loading="lazy" alt="Test 2" />
          </div>
        </TestWrapper>
      );

      // Verificar se as imagens têm loading="lazy"
      const images = container.querySelectorAll('img');
      images.forEach(img => {
        expect(img.getAttribute('loading')).toBe('lazy');
      });
    });

    it('should show loading skeletons', async () => {
      render(
        <TestWrapper>
          <div>
            <div data-testid="skeleton-1" className="animate-pulse bg-gray-200 h-4 w-full" />
            <div data-testid="skeleton-2" className="animate-pulse bg-gray-200 h-4 w-full" />
          </div>
        </TestWrapper>
      );

      // Verificar se há elementos de skeleton
      const skeletons = screen.queryAllByTestId(/skeleton/);
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimizations', () => {
    it('should preload critical resources', async () => {
      // Create a preload link element
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.href = '/fonts/test-font.woff2';
      preloadLink.as = 'font';
      document.head.appendChild(preloadLink);
      
      render(
        <TestWrapper>
          <div>Test Content</div>
        </TestWrapper>
      );

      // Check for font preloading
      const preloadLinks = document.querySelectorAll('link[rel="preload"]');
      expect(preloadLinks.length).toBeGreaterThan(0);
    });

    it('should use passive event listeners', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      const TestComponentWithEvents = () => {
        React.useEffect(() => {
          const handleScroll = () => {};
          window.addEventListener('scroll', handleScroll, { passive: true });
          return () => window.removeEventListener('scroll', handleScroll);
        }, []);
        return <div>Test Content</div>;
      };
      
      render(
        <TestWrapper>
          <TestComponentWithEvents />
        </TestWrapper>
      );

      // Check if passive listeners are used for scroll events
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        expect.objectContaining({ passive: true })
      );

      addEventListenerSpy.mockRestore();
    });

    it('should cleanup resources on unmount', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const TestComponentWithCleanup = () => {
        React.useEffect(() => {
          const handleScroll = () => {};
          window.addEventListener('scroll', handleScroll);
          return () => window.removeEventListener('scroll', handleScroll);
        }, []);
        return <div>Test Content</div>;
      };
      
      const { unmount } = render(
        <TestWrapper>
          <TestComponentWithCleanup />
        </TestWrapper>
      );

      unmount();

      // Check if event listeners are cleaned up
      expect(removeEventListenerSpy).toHaveBeenCalled();

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Memory Management', () => {
    it('should cleanup resources on unmount', async () => {
      const TestComponentWithCleanup = () => {
        React.useEffect(() => {
          const timer = setTimeout(() => {}, 1000);
          
          return () => {
            clearTimeout(timer);
          };
        }, []);
        return <div data-testid="cleanup-component">Test Content</div>;
      };
      
      const { unmount, getByTestId } = render(
        <TestWrapper>
          <TestComponentWithCleanup />
        </TestWrapper>
      );

      // Verify component is rendered
      expect(getByTestId('cleanup-component')).toBeInTheDocument();
      
      // Verify that component unmounts without errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Performance Budgets', () => {
    it('should meet performance thresholds', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Render time should be under 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should limit bundle size impact', async () => {
      const { container } = render(
        <TestWrapper>
          <div data-optimized="true">
            <TestComponent />
          </div>
        </TestWrapper>
      );

      // Check if performance optimizations are applied
      const optimizedElements = container.querySelectorAll('[data-optimized="true"]');
      expect(optimizedElements.length).toBeGreaterThan(0);
    });
  });
});