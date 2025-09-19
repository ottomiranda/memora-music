// Script de teste para a seção de artistas
// Execute no console do navegador para testar a funcionalidade

console.log('🎵 Iniciando teste da seção de artistas...');

// Aguarda a página carregar completamente
setTimeout(() => {
  // Encontra todos os botões de play na seção de artistas
  const playButtons = document.querySelectorAll('#artistas button[aria-label*="Reproduzir"]');
  console.log(`📊 Encontrados ${playButtons.length} botões de play`);
  
  if (playButtons.length === 0) {
    console.error('❌ Nenhum botão de play encontrado!');
    return;
  }
  
  // Testa o primeiro botão
  console.log('🎯 Testando primeiro botão de play...');
  const firstButton = playButtons[0];
  
  // Simula clique
  firstButton.click();
  
  // Verifica se o GlobalAudioPlayer apareceu
  setTimeout(() => {
    const audioPlayer = document.querySelector('.fixed.bottom-4');
    if (audioPlayer) {
      console.log('✅ GlobalAudioPlayer apareceu com sucesso!');
      
      // Verifica se há áudio tocando
      const audioElement = document.querySelector('audio');
      if (audioElement) {
        console.log('🔊 Elemento de áudio encontrado:', {
          src: audioElement.src,
          paused: audioElement.paused,
          currentTime: audioElement.currentTime,
          duration: audioElement.duration
        });
      } else {
        console.warn('⚠️ Elemento de áudio não encontrado');
      }
    } else {
      console.error('❌ GlobalAudioPlayer não apareceu');
    }
  }, 2000);
  
}, 3000);

console.log('⏳ Aguardando 3 segundos para iniciar o teste...');