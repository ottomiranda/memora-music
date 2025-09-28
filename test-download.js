// Teste simples para verificar a função ensureMp3Extension
import { ensureMp3Extension } from './src/utils/download.js';

// Testes
console.log('Teste 1 - Nome sem extensão:', ensureMp3Extension('minha_musica'));
console.log('Teste 2 - Nome com extensão:', ensureMp3Extension('minha_musica.mp3'));
console.log('Teste 3 - Nome vazio:', ensureMp3Extension(''));
console.log('Teste 4 - Nome null:', ensureMp3Extension(null));
console.log('Teste 5 - Nome undefined:', ensureMp3Extension(undefined));
console.log('Teste 6 - Nome com espaços:', ensureMp3Extension('  minha musica  '));

// Simular o que acontece na função handleDownload
const song = { title: 'Minha Música Teste' };
const label = 'A';
const baseName = `${song.title}${label ? `_${label}` : ''}`;
const friendly = ensureMp3Extension(baseName);
console.log('\nTeste real - baseName:', baseName);
console.log('Teste real - friendly:', friendly);