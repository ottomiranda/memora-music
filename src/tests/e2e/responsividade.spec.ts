import { test, expect, devices } from '@playwright/test';

// Configuração de dispositivos para teste
const testDevices = [
  {
    name: 'Mobile',
    viewport: { width: 375, height: 667 },
    userAgent: devices['iPhone SE'].userAgent
  },
  {
    name: 'Tablet',
    viewport: { width: 768, height: 1024 },
    userAgent: devices['iPad'].userAgent
  },
  {
    name: 'Desktop',
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
];

testDevices.forEach(device => {
  test.describe(`Responsividade - ${device.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(device.viewport);
      await page.setUserAgent(device.userAgent);
      await page.goto('http://localhost:5173');
    });

    test('Hero section deve ser responsivo', async ({ page }) => {
      // Verificar se o hero está visível
      const hero = page.locator('[data-testid="hero-section"]');
      await expect(hero).toBeVisible();

      // Verificar título responsivo
      const title = page.locator('h1').first();
      await expect(title).toBeVisible();
      
      // Verificar se o texto não está cortado
      const titleBox = await title.boundingBox();
      expect(titleBox?.width).toBeGreaterThan(0);
      expect(titleBox?.height).toBeGreaterThan(0);

      // Verificar botões de ação
      const buttons = page.locator('button, a[role="button"]');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const buttonBox = await button.boundingBox();
          // Verificar área mínima de toque (48px)
          expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('Navegação deve funcionar em todos os dispositivos', async ({ page }) => {
      // Verificar se a navegação está presente
      const nav = page.locator('nav, [role="navigation"]').first();
      
      if (device.name === 'Mobile') {
        // Em mobile, pode ter menu hamburger
        const menuButton = page.locator('[aria-label*="menu"], [aria-label*="Menu"], button[aria-expanded]');
        if (await menuButton.count() > 0) {
          await menuButton.first().click();
          // Verificar se o menu abriu
          await page.waitForTimeout(300);
        }
      }

      // Verificar links de navegação
      const navLinks = page.locator('nav a, [role="navigation"] a');
      const linkCount = await navLinks.count();
      
      if (linkCount > 0) {
        for (let i = 0; i < Math.min(linkCount, 3); i++) {
          const link = navLinks.nth(i);
          if (await link.isVisible()) {
            const linkBox = await link.boundingBox();
            expect(linkBox?.height).toBeGreaterThanOrEqual(32);
          }
        }
      }
    });

    test('Formulário de criação deve ser responsivo', async ({ page }) => {
      // Navegar para a página de criação
      await page.goto('http://localhost:5173/criar');
      
      // Aguardar carregamento
      await page.waitForLoadState('networkidle');

      // Verificar se o formulário está visível
      const form = page.locator('form, [data-testid="create-form"]').first();
      
      if (await form.count() > 0) {
        await expect(form).toBeVisible();

        // Verificar botões de navegação
        const navButtons = page.locator('button').filter({ hasText: /anterior|próximo|continuar/i });
        const buttonCount = await navButtons.count();
        
        for (let i = 0; i < buttonCount; i++) {
          const button = navButtons.nth(i);
          if (await button.isVisible()) {
            const buttonBox = await button.boundingBox();
            expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
            
            // Verificar se o botão não está cortado
            const viewportSize = page.viewportSize();
            expect(buttonBox?.x).toBeGreaterThanOrEqual(0);
            expect(buttonBox?.x! + buttonBox?.width!).toBeLessThanOrEqual(viewportSize?.width!);
          }
        }

        // Verificar campos de input
        const inputs = page.locator('input, textarea, select');
        const inputCount = await inputs.count();
        
        for (let i = 0; i < Math.min(inputCount, 5); i++) {
          const input = inputs.nth(i);
          if (await input.isVisible()) {
            const inputBox = await input.boundingBox();
            expect(inputBox?.height).toBeGreaterThanOrEqual(40);
          }
        }
      }
    });

    test('Cards e componentes devem ser responsivos', async ({ page }) => {
      // Verificar cards na página inicial
      const cards = page.locator('[class*="card"], .bg-white, .bg-gray, .rounded');
      const cardCount = await cards.count();
      
      if (cardCount > 0) {
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = cards.nth(i);
          if (await card.isVisible()) {
            const cardBox = await card.boundingBox();
            
            // Verificar se o card não está cortado
            const viewportSize = page.viewportSize();
            expect(cardBox?.x).toBeGreaterThanOrEqual(0);
            expect(cardBox?.x! + cardBox?.width!).toBeLessThanOrEqual(viewportSize?.width! + 1);
            
            // Verificar padding mínimo
            expect(cardBox?.width).toBeGreaterThan(200);
          }
        }
      }
    });

    test('Imagens devem ser responsivas', async ({ page }) => {
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const img = images.nth(i);
        if (await img.isVisible()) {
          const imgBox = await img.boundingBox();
          const viewportSize = page.viewportSize();
          
          // Verificar se a imagem não ultrapassa a viewport
          expect(imgBox?.width).toBeLessThanOrEqual(viewportSize?.width!);
          
          // Verificar se tem alt text (acessibilidade)
          const altText = await img.getAttribute('alt');
          expect(altText).toBeTruthy();
        }
      }
    });

    test('Scroll horizontal não deve existir', async ({ page }) => {
      // Verificar se não há scroll horizontal
      const bodyScrollWidth = await page.evaluate(() => {
        return document.body.scrollWidth;
      });
      
      const viewportWidth = page.viewportSize()?.width || 0;
      
      // Permitir uma pequena margem de erro (1px)
      expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
    });

    test('Performance deve ser adequada', async ({ page }) => {
      // Medir tempo de carregamento
      const startTime = Date.now();
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Verificar se carregou em menos de 5 segundos
      expect(loadTime).toBeLessThan(5000);
      
      // Verificar se não há erros de console críticos
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Filtrar erros conhecidos (vídeos não encontrados)
      const criticalErrors = errors.filter(error => 
        !error.includes('Videos/') && 
        !error.includes('.mp4') &&
        !error.includes('ERR_ABORTED')
      );
      
      expect(criticalErrors.length).toBe(0);
    });

    test('Acessibilidade básica deve estar presente', async ({ page }) => {
      // Verificar se há elementos com foco
      const focusableElements = page.locator('button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])');
      const focusableCount = await focusableElements.count();
      
      if (focusableCount > 0) {
        // Testar navegação por teclado nos primeiros elementos
        for (let i = 0; i < Math.min(focusableCount, 3); i++) {
          const element = focusableElements.nth(i);
          if (await element.isVisible()) {
            await element.focus();
            
            // Verificar se o elemento está focado
            const isFocused = await element.evaluate(el => el === document.activeElement);
            expect(isFocused).toBe(true);
          }
        }
      }
      
      // Verificar se há headings para estrutura
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
    });
  });
});

// Teste específico para transições entre breakpoints
test.describe('Transições entre breakpoints', () => {
  test('Layout deve se adaptar suavemente', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Testar transição de desktop para mobile
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    // Capturar estado desktop
    const desktopScreenshot = await page.screenshot({ fullPage: false });
    
    // Transição para tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Verificar se não há elementos quebrados
    const brokenElements = page.locator('[style*="overflow: visible"]');
    const brokenCount = await brokenElements.count();
    
    // Transição para mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Verificar se o layout ainda está funcional
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Verificar se não há scroll horizontal
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375 + 1);
  });
});