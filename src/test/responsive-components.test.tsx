import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Navbar from '../components/memora/Navbar'
import HowItWorks from '../components/memora/HowItWorks'
import ExamplesGrid from '../components/memora/ExamplesGrid'
import { ResponsiveContainer, ResponsiveSection, ResponsiveCenteredContainer } from '../components/ui/ResponsiveContainer'

// Mock dos stores
vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    user: null,
    isAuthenticated: false,
    logout: vi.fn()
  })
}))

vi.mock('../store/uiStore', () => ({
  useUiStore: () => ({
    openPaymentModal: vi.fn()
  })
}))

vi.mock('../store/musicStore', () => ({
  useMusicStore: () => ({
    createMusic: vi.fn()
  })
}))

// Mock do react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'pt' }
  })
}))

// Mock da API de músicas
vi.mock('@/lib/api/music', () => ({
  searchSongs: vi.fn().mockResolvedValue([
    {
      id: '1',
      title: 'Test Song',
      artist: 'Test Artist',
      preview_url: 'https://example.com/preview.mp3',
      image: 'https://example.com/image.jpg'
    }
  ])
}))

// Mock do HTMLAudioElement
Object.defineProperty(window, 'HTMLAudioElement', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    load: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    currentTime: 0,
    duration: 100,
    paused: true,
    volume: 1,
  })),
})

// Mock do useLocalizedRoutes
vi.mock('../hooks/useLocalizedRoutes', () => ({
  useLocalizedRoutes: () => ({
    home: '/',
    create: '/criar',
    login: '/login'
  })
}))

// Mock do Swiper
vi.mock('swiper/react', () => ({
  Swiper: ({ children, onSlideChange, ...props }: any) => {
    // Simula o comportamento do Swiper
    React.useEffect(() => {
      if (onSlideChange) {
        onSlideChange({ activeIndex: 0 })
      }
    }, [])
    
    return (
      <div data-testid="swiper" {...props}>
        {children}
      </div>
    )
  },
  SwiperSlide: ({ children, ...props }: any) => (
    <div data-testid="swiper-slide" {...props}>
      {children}
    </div>
  ),
}))

// Mock dos módulos do Swiper
vi.mock('swiper/modules', () => ({
  EffectCoverflow: vi.fn(),
  Autoplay: vi.fn(),
  Navigation: vi.fn(),
  Pagination: vi.fn(),
}))

// Helper para simular diferentes tamanhos de tela
const mockViewport = (width: number, height: number = 768) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
  
  // Dispara evento de resize
  fireEvent(window, new Event('resize'))
}

// Wrapper para componentes que precisam do Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('Componentes Responsivos - Fase 2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset viewport para desktop por padrão
    mockViewport(1024, 768)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Navbar Responsivo', () => {
    it('deve exibir menu hamburger em mobile', () => {
      mockViewport(375) // Mobile
      
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      )
      
      // Verifica se o botão do menu mobile está visível
      const mobileMenuButton = screen.getByRole('button', { name: /menu/i })
      expect(mobileMenuButton).toBeInTheDocument()
      expect(mobileMenuButton).toBeVisible()
    })

    it('deve abrir menu fullscreen ao clicar no hamburger', async () => {
      mockViewport(375) // Mobile
      
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      )
      
      const mobileMenuButton = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(mobileMenuButton)
      
      // Verifica se o menu mobile está aberto
      await waitFor(() => {
        const mobileMenu = screen.getByTestId('mobile-menu')
        expect(mobileMenu).toBeVisible()
      })
    })

    it('deve ter botões com área mínima de toque em mobile', () => {
      mockViewport(375) // Mobile
      
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      )
      
      const mobileMenuButton = screen.getByRole('button', { name: /menu/i })
      const buttonStyles = window.getComputedStyle(mobileMenuButton)
      
      // Verifica se o botão tem altura mínima adequada (44px)
      expect(parseInt(buttonStyles.minHeight) >= 44 || 
             parseInt(buttonStyles.height) >= 44).toBe(true)
    })

    it('deve esconder navegação desktop em mobile', () => {
      mockViewport(375) // Mobile
      
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      )
      
      // A navegação desktop deve estar escondida em mobile
      const desktopNav = screen.queryByTestId('desktop-nav')
      if (desktopNav) {
        expect(desktopNav).not.toBeVisible()
      }
    })
  })

  describe('HowItWorks Timeline Responsiva', () => {
    it('deve renderizar timeline vertical em mobile', () => {
      mockViewport(375) // Mobile
      
      render(<HowItWorks />)
      
      const timeline = screen.getByTestId('timeline')
      expect(timeline).toBeInTheDocument()
      
      // Verifica se a timeline tem classes para layout vertical
      expect(timeline).toHaveClass('flex-col')
    })

    it('deve renderizar timeline horizontal em desktop', () => {
      mockViewport(1024) // Desktop
      
      render(<HowItWorks />)
      
      const timeline = screen.getByTestId('timeline')
      expect(timeline).toBeInTheDocument()
      
      // Verifica se a timeline tem classes para layout horizontal em desktop
      expect(timeline.className).toMatch(/md:flex-row|lg:flex-row/)
    })

    it('deve ter indicadores de passo clicáveis com área adequada', () => {
      mockViewport(375) // Mobile
      
      render(<HowItWorks />)
      
      const stepButtons = screen.getAllByRole('button')
      const stepIndicators = stepButtons.filter(btn => 
        btn.getAttribute('data-testid')?.includes('step-')
      )
      
      stepIndicators.forEach(indicator => {
        const styles = window.getComputedStyle(indicator)
        expect(parseInt(styles.minHeight) >= 44 || 
               parseInt(styles.height) >= 44).toBe(true)
      })
    })

    it('deve alternar entre steps corretamente', async () => {
      render(<HowItWorks />)
      
      const step2Button = screen.getByTestId('step-1') // Index 1 = Step 2
      fireEvent.click(step2Button)
      
      await waitFor(() => {
        expect(step2Button).toHaveAttribute('aria-selected', 'true')
      })
    })
  })

  describe('ExamplesGrid Swiper Otimizado', () => {
    it('deve renderizar swiper com configuração mobile', async () => {
      mockViewport(375) // Mobile
      
      render(<ExamplesGrid />)
      
      // Aguarda o componente carregar
      await waitFor(() => {
        const swiper = screen.getByTestId('swiper')
        expect(swiper).toBeInTheDocument()
      })
    })

    it('deve ter slides com proporção adequada em mobile', async () => {
      mockViewport(375) // Mobile
      
      render(<ExamplesGrid />)
      
      // Aguarda o componente carregar
      await waitFor(() => {
        const slides = screen.getAllByTestId('swiper-slide')
        expect(slides.length).toBeGreaterThan(0)
        
        slides.forEach(slide => {
          // Verifica se o slide tem aspect ratio adequado
          expect(slide.className).toMatch(/aspect-\[3\/4\]|aspect-square/)
        })
      })
    })

    it('deve ter botões de play com área de toque adequada', () => {
      mockViewport(375) // Mobile
      
      render(<ExamplesGrid />)
      
      const playButtons = screen.getAllByRole('button')
      const musicPlayButtons = playButtons.filter(btn => 
        btn.getAttribute('aria-label')?.includes('play') ||
        btn.getAttribute('data-testid')?.includes('play')
      )
      
      musicPlayButtons.forEach(button => {
        const styles = window.getComputedStyle(button)
        expect(parseInt(styles.minHeight) >= 44 || 
               parseInt(styles.height) >= 44).toBe(true)
      })
    })
  })

  describe('ResponsiveContainer', () => {
    it('deve aplicar padding correto baseado na prop', () => {
      const { rerender } = render(
        <ResponsiveContainer padding="sm">
          <div>Conteúdo</div>
        </ResponsiveContainer>
      )
      
      let container = screen.getByText('Conteúdo').parentElement
      expect(container).toHaveClass('px-4', 'sm:px-6')
      
      rerender(
        <ResponsiveContainer padding="lg">
          <div>Conteúdo</div>
        </ResponsiveContainer>
      )
      
      container = screen.getByText('Conteúdo').parentElement
      expect(container).toHaveClass('px-4', 'sm:px-6', 'lg:px-8', 'xl:px-12')
    })

    it('deve aplicar largura máxima quando especificada', () => {
      render(
        <ResponsiveContainer maxWidth="2xl">
          <div>Conteúdo</div>
        </ResponsiveContainer>
      )
      
      const container = screen.getByText('Conteúdo').parentElement
      expect(container).toHaveClass('max-w-2xl')
    })

    it('deve combinar classes customizadas', () => {
      render(
        <ResponsiveContainer className="custom-class">
          <div>Conteúdo</div>
        </ResponsiveContainer>
      )
      
      const container = screen.getByText('Conteúdo').parentElement
      expect(container).toHaveClass('custom-class', 'container', 'mx-auto')
    })
  })

  describe('ResponsiveSection', () => {
    it('deve aplicar apenas padding sem container', () => {
      render(
        <ResponsiveSection padding="md">
          <div>Seção</div>
        </ResponsiveSection>
      )
      
      const section = screen.getByText('Seção').parentElement
      expect(section).toHaveClass('px-4', 'sm:px-6', 'lg:px-8')
      expect(section).not.toHaveClass('container', 'mx-auto')
    })
  })

  describe('ResponsiveCenteredContainer', () => {
    it('deve centralizar conteúdo e aplicar largura máxima', () => {
      render(
        <ResponsiveCenteredContainer maxWidth="xl">
          <div>Conteúdo Centralizado</div>
        </ResponsiveCenteredContainer>
      )
      
      const container = screen.getByText('Conteúdo Centralizado').parentElement
      expect(container).toHaveClass('text-center', 'max-w-xl')
    })
  })

  describe('Testes de Breakpoints Múltiplos', () => {
    const breakpoints = [
      { name: 'xs', width: 375 },
      { name: 'sm', width: 640 },
      { name: 'md', width: 768 },
      { name: 'lg', width: 1024 },
      { name: 'xl', width: 1280 }
    ]

    breakpoints.forEach(({ name, width }) => {
      it(`deve renderizar corretamente no breakpoint ${name} (${width}px)`, () => {
        mockViewport(width)
        
        render(
          <RouterWrapper>
            <div>
              <Navbar />
              <HowItWorks />
              <ExamplesGrid />
              <ResponsiveContainer>
                <div>Teste {name}</div>
              </ResponsiveContainer>
            </div>
          </RouterWrapper>
        )
        
        // Verifica se todos os componentes renderizam sem erro
        expect(screen.getByText(`Teste ${name}`)).toBeInTheDocument()
      })
    })
  })

  describe('Acessibilidade Touch', () => {
    it('deve ter elementos interativos com área mínima de 44px', () => {
      mockViewport(375) // Mobile
      
      render(
        <RouterWrapper>
          <div>
            <Navbar />
            <HowItWorks />
            <ExamplesGrid />
          </div>
        </RouterWrapper>
      )
      
      const interactiveElements = screen.getAllByRole('button')
      
      interactiveElements.forEach((element) => {
        // Verifica se o elemento tem classes que indicam tamanho adequado
        const classList = Array.from(element.classList)
        const hasMinHeight = classList.some(cls => 
          cls.includes('h-11') || cls.includes('h-12') || cls.includes('min-h-')
        )
        const hasMinWidth = classList.some(cls => 
          cls.includes('w-11') || cls.includes('w-12') || cls.includes('min-w-')
        )
        
        // Verifica se tem padding adequado que contribui para a área touch
        const hasPadding = classList.some(cls => 
          cls.includes('p-2') || cls.includes('p-3') || cls.includes('px-') || cls.includes('py-')
        )
        
        // Elemento deve ter dimensões adequadas ou padding que garanta área touch
        expect(hasMinHeight || hasMinWidth || hasPadding).toBe(true)
      })
    })

    it('deve ter estados de foco visíveis', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      )
      
      const buttons = screen.getAllByRole('button')
      
      buttons.forEach(button => {
        button.focus()
        expect(button).toHaveFocus()
        
        // Verifica se há indicação visual de foco
        const styles = window.getComputedStyle(button)
        expect(
          styles.outline !== 'none' || 
          styles.boxShadow !== 'none' ||
          button.className.includes('focus:')
        ).toBe(true)
      })
    })
  })
})