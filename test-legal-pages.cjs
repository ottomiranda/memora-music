// Teste mais detalhado para verificar se as páginas legais estão funcionando
const puppeteer = require('puppeteer');

async function testLegalPages() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capturar erros do console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });
  
  const baseUrl = 'http://localhost:5173';
  const routes = [
    '/termos-de-uso',
    '/politica-de-privacidade', 
    '/terms-of-use',
    '/privacy-policy'
  ];
  
  console.log('🧪 Testando páginas legais...');
  
  for (const route of routes) {
    try {
      console.log(`\n📄 Testando: ${baseUrl}${route}`);
      
      const response = await page.goto(`${baseUrl}${route}`, { 
        waitUntil: 'networkidle0',
        timeout: 15000 
      });
      
      if (response.status() === 200) {
        console.log('✅ Status: 200 OK');
        
        // Aguardar um pouco para o React carregar
    await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar se há conteúdo na página
        const title = await page.title();
        console.log(`📋 Título: ${title}`);
        
        // Verificar se há texto na página
        const bodyText = await page.evaluate(() => {
          return document.body.innerText.trim();
        });
        
        console.log(`📝 Conteúdo (primeiros 200 chars): ${bodyText.substring(0, 200)}...`);
        
        if (bodyText.length > 100) {
          console.log(`✅ Conteúdo encontrado: ${bodyText.length} caracteres`);
        } else {
          console.log(`⚠️  Pouco conteúdo: ${bodyText.length} caracteres`);
        }
        
        // Verificar se há elementos específicos das páginas legais
        const hasLegalContent = await page.evaluate(() => {
          const text = document.body.innerText.toLowerCase();
          return text.includes('termos') || text.includes('terms') || 
                 text.includes('privacidade') || text.includes('privacy') ||
                 text.includes('política') || text.includes('policy');
        });
        
        if (hasLegalContent) {
          console.log('✅ Conteúdo legal detectado');
        } else {
          console.log('⚠️  Conteúdo legal não detectado');
        }
        
      } else {
        console.log(`❌ Status: ${response.status()}`);
      }
      
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
  }
  
  await browser.close();
  console.log('\n🏁 Teste concluído!');
}

testLegalPages().catch(console.error);