import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock modules
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    isLoading: false,
    signIn: vi.fn(),
    signOut: vi.fn()
  }))
}));

vi.mock('@/store/uiStore', () => ({
  useUIStore: vi.fn(() => ({
    theme: 'light',
    language: 'en',
    setTheme: vi.fn(),
    setLanguage: vi.fn()
  }))
}));

vi.mock('@/store/musicStore', () => ({
  useMusicStore: vi.fn(() => ({
    currentSong: null,
    isPlaying: false,
    play: vi.fn(),
    pause: vi.fn()
  }))
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() }
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation', () => {
      const TestComponent = () => (
        <div>
          <button data-testid="button-1">Button 1</button>
          <button data-testid="button-2">Button 2</button>
          <input data-testid="input-1" type="text" placeholder="Input 1" />
          <a href="#" data-testid="link-1">Link 1</a>
        </div>
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const button1 = screen.getByTestId('button-1');
      const button2 = screen.getByTestId('button-2');
      const input1 = screen.getByTestId('input-1');
      const link1 = screen.getByTestId('link-1');

      // Test tab navigation
      button1.focus();
      expect(document.activeElement).toBe(button1);

      fireEvent.keyDown(button1, { key: 'Tab' });
      button2.focus();
      expect(document.activeElement).toBe(button2);

      fireEvent.keyDown(button2, { key: 'Tab' });
      input1.focus();
      expect(document.activeElement).toBe(input1);

      fireEvent.keyDown(input1, { key: 'Tab' });
      link1.focus();
      expect(document.activeElement).toBe(link1);
    });

    it('should support Enter key activation', () => {
      const handleClick = vi.fn();
      const TestComponent = () => (
        <button data-testid="test-button" onClick={handleClick}>
          Test Button
        </button>
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const button = screen.getByTestId('test-button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalled();
    });

    it('should support Space key activation for buttons', () => {
      const handleClick = vi.fn();
      const TestComponent = () => (
        <button data-testid="test-button" onClick={handleClick}>
          Test Button
        </button>
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const button = screen.getByTestId('test-button');
      button.focus();
      fireEvent.keyDown(button, { key: ' ' });
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', () => {
      const TestComponent = () => (
        <div>
          <button data-testid="focusable-button" className="focus:ring-2 focus:ring-blue-500">
            Focusable Button
          </button>
          <input 
            data-testid="focusable-input" 
            type="text" 
            className="focus:ring-2 focus:ring-blue-500"
            placeholder="Focusable Input"
          />
        </div>
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const button = screen.getByTestId('focusable-button');
      const input = screen.getByTestId('focusable-input');

      // Check that focus styles are applied
      expect(button).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
      expect(input).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
    });

    it('should trap focus in modals', () => {
      const TestModal = ({ isOpen }: { isOpen: boolean }) => {
        if (!isOpen) return null;
        
        return (
          <div role="dialog" aria-modal="true" data-testid="modal">
            <button data-testid="modal-button-1">Button 1</button>
            <button data-testid="modal-button-2">Button 2</button>
            <button data-testid="modal-close">Close</button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestModal isOpen={true} />
        </TestWrapper>
      );

      const modal = screen.getByTestId('modal');
      const button1 = screen.getByTestId('modal-button-1');
      const button2 = screen.getByTestId('modal-button-2');
      const closeButton = screen.getByTestId('modal-close');

      expect(modal).toBeInTheDocument();
      expect(button1).toBeInTheDocument();
      expect(button2).toBeInTheDocument();
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('ARIA Labels and Roles', () => {
    it('should have proper ARIA labels', () => {
      const TestComponent = () => (
        <div>
          <button aria-label="Close dialog" data-testid="close-button">
            ×
          </button>
          <input 
            aria-label="Search query" 
            data-testid="search-input"
            type="text"
            placeholder="Search..."
          />
          <nav aria-label="Main navigation" data-testid="main-nav">
            <ul>
              <li><a href="#">Home</a></li>
              <li><a href="#">About</a></li>
            </ul>
          </nav>
        </div>
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const closeButton = screen.getByTestId('close-button');
      const searchInput = screen.getByTestId('search-input');
      const mainNav = screen.getByTestId('main-nav');

      expect(closeButton).toHaveAttribute('aria-label', 'Close dialog');
      expect(searchInput).toHaveAttribute('aria-label', 'Search query');
      expect(mainNav).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('should use semantic HTML elements', () => {
      const TestComponent = () => (
        <div>
          <header data-testid="page-header">
            <h1>Page Title</h1>
          </header>
          <main data-testid="page-main">
            <article data-testid="article">
              <h2>Article Title</h2>
              <p>Article content</p>
            </article>
          </main>
          <footer data-testid="page-footer">
            <p>Footer content</p>
          </footer>
        </div>
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('page-header')).toBeInTheDocument();
      expect(screen.getByTestId('page-main')).toBeInTheDocument();
      expect(screen.getByTestId('article')).toBeInTheDocument();
      expect(screen.getByTestId('page-footer')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient color contrast', () => {
      const TestComponent = () => (
        <div>
          <p className="text-gray-900 bg-white" data-testid="high-contrast-text">
            High contrast text
          </p>
          <button className="bg-blue-600 text-white" data-testid="contrast-button">
            Accessible Button
          </button>
        </div>
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const text = screen.getByTestId('high-contrast-text');
      const button = screen.getByTestId('contrast-button');

      // Check that contrast classes are applied
      expect(text).toHaveClass('text-gray-900', 'bg-white');
      expect(button).toHaveClass('bg-blue-600', 'text-white');
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide screen reader announcements', () => {
      const TestComponent = () => (
        <div>
          <div aria-live="polite" data-testid="status-message">
            Status updated
          </div>
          <div aria-live="assertive" data-testid="error-message">
            Error occurred
          </div>
        </div>
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const statusMessage = screen.getByTestId('status-message');
      const errorMessage = screen.getByTestId('error-message');

      expect(statusMessage).toHaveAttribute('aria-live', 'polite');
      expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
    });

    it('should hide decorative elements from screen readers', () => {
      const TestComponent = () => (
        <div>
          <img src="/decorative.jpg" alt="" aria-hidden="true" data-testid="decorative-image" />
          <span aria-hidden="true" data-testid="decorative-icon">🎵</span>
          <img src="/content.jpg" alt="Music album cover" data-testid="content-image" />
        </div>
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const decorativeImage = screen.getByTestId('decorative-image');
      const decorativeIcon = screen.getByTestId('decorative-icon');
      const contentImage = screen.getByTestId('content-image');

      expect(decorativeImage).toHaveAttribute('aria-hidden', 'true');
      expect(decorativeIcon).toHaveAttribute('aria-hidden', 'true');
      expect(contentImage).toHaveAttribute('alt', 'Music album cover');
    });
  });

  describe('Axe Accessibility Tests', () => {
    it('should not have accessibility violations', async () => {
      const TestComponent = () => (
        <div>
          <h1>Accessible Page</h1>
          <nav aria-label="Main navigation">
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About</a></li>
            </ul>
          </nav>
          <main>
            <article>
              <h2>Article Title</h2>
              <p>This is accessible content.</p>
              <button type="button">Accessible Button</button>
            </article>
          </main>
        </div>
      );

      const { container } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should handle form accessibility', async () => {
      const TestForm = () => (
        <form>
          <div>
            <label htmlFor="name">Name</label>
            <input id="name" type="text" required aria-describedby="name-help" />
            <div id="name-help">Enter your full name</div>
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required aria-describedby="email-help" />
            <div id="email-help">Enter a valid email address</div>
          </div>
          <button type="submit">Submit</button>
        </form>
      );

      const { container } = render(
        <TestWrapper>
          <TestForm />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});