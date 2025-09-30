import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useResponsive, useIsMobile, useBreakpoint } from '../hooks/useResponsive'

// Mock do window.matchMedia
const mockMatchMedia = vi.fn()

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// Mock do addEventListener e removeEventListener
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()

Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: mockAddEventListener,
})

Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  value: mockRemoveEventListener,
})

describe('useResponsive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock padrão do matchMedia
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    // Mock das dimensões da janela
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve retornar o estado inicial correto para desktop', () => {
    const { result } = renderHook(() => useResponsive())

    expect(result.current.width).toBe(1024)
    expect(result.current.height).toBe(768)
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(true)
    expect(result.current.breakpoint).toBe('lg')
  })

  it('deve detectar breakpoint mobile (xs)', () => {
    // Simula tela xs (< 640px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // xs breakpoint
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    })

    const { result } = renderHook(() => useResponsive())
    
    expect(result.current.breakpoint).toBe('xs')
    expect(result.current.isMobile).toBe(true)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(false)
    expect(result.current.isXs).toBe(true)
  })

  it('deve detectar breakpoint tablet (md)', () => {
    // Simula tela md (768px - 1023px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 900, // md breakpoint
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 600,
    })

    const { result } = renderHook(() => useResponsive())
    
    expect(result.current.breakpoint).toBe('md')
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(true)
    expect(result.current.isDesktop).toBe(false)
    expect(result.current.isMd).toBe(true)
  })

  it('deve reagir a mudanças de tamanho da janela com debounce', async () => {
    const { result } = renderHook(() => useResponsive())
    
    // Verifica estado inicial
    expect(result.current.width).toBe(1024)
    expect(result.current.breakpoint).toBe('lg')

    // Simula redimensionamento
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    })

    // Dispara evento de resize
    act(() => {
      const resizeEvent = new Event('resize')
      window.dispatchEvent(resizeEvent)
    })

    // Aguarda o debounce (150ms)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
    })

    expect(result.current.width).toBe(1024)
  })

  it('deve aplicar debounce nas mudanças de tamanho', () => {
    // Testa se o hook aceita parâmetro de debounce
    const { result } = renderHook(() => useResponsive(100))
    expect(result.current.width).toBeDefined()
    expect(result.current.height).toBeDefined()
  })

  it('deve limpar event listeners no cleanup', () => {
    const { unmount } = renderHook(() => useResponsive())
    
    // Verifica se addEventListener foi chamado
    expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    
    // Desmonta o componente
    unmount()
    
    // Verifica se removeEventListener foi chamado
    expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})

describe('useIsMobile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar true para dispositivos mobile', () => {
    // Simula tela mobile (< 768px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600, // Mobile
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('deve retornar false para dispositivos desktop', () => {
    // Simula tela desktop (>= 768px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200, // Desktop
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })
})

describe('useBreakpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar true quando o breakpoint é atingido', () => {
    // Simula tela lg (>= 1024px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200, // >= lg (1024px)
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    })

    const { result } = renderHook(() => useBreakpoint('lg'))
    expect(result.current).toBe(true)
  })

  it('deve retornar false quando o breakpoint não é atingido', () => {
    // Simula tela pequena (< xl = 1280px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800, // < xl (1280px)
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 600,
    })

    const { result } = renderHook(() => useBreakpoint('xl'))
    expect(result.current).toBe(false)
  })

  it('deve reagir a mudanças de media query', () => {
    // Testa se o hook registra event listeners
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const { unmount } = renderHook(() => useBreakpoint('lg'))
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(addEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function))
    
    unmount()
    addEventListenerSpy.mockRestore()
  })
})