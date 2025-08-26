import React from 'react';
import GenreSelector from '@/components/GenreSelector';
import { useMusicStore } from '@/store/musicStore';

/**
 * Exemplo de como integrar o GenreSelector na página Criar.tsx
 * 
 * Para substituir a seleção atual de gêneros (linhas ~418-448 em Criar.tsx),
 * substitua o bloco RadioGroup por este componente:
 */

const GenreSelectorIntegrationExample: React.FC = () => {
  const { formData, updateFormData } = useMusicStore();

  const handleGenreSelection = (genreId: string, subGenreId?: string) => {
    // Aqui você pode customizar como salvar a seleção
    // Exemplo: salvar apenas o ID do gênero
    updateFormData({ genre: genreId });
    
    // Ou salvar o nome completo do gênero + subgênero
    // O componente já faz isso automaticamente via updateFormData
    
    console.log('Gênero selecionado:', { genreId, subGenreId });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Escolha o estilo musical</h2>
        <p className="text-muted-foreground">
          Selecione o gênero musical e as preferências para sua música
        </p>
      </div>

      {/* Substituir o RadioGroup atual por este componente */}
      <div className="space-y-4">
        <GenreSelector
          onGenreSelect={handleGenreSelection}
          selectedGenre={formData.genre}
          className="w-full"
        />
      </div>

      {/* Resto do formulário continua igual... */}
      {/* Emoção, Vocal Preference, etc. */}
    </div>
  );
};

/**
 * INSTRUÇÕES DE INTEGRAÇÃO:
 * 
 * 1. Na página Criar.tsx, no case 2 do renderStepContent:
 *    - Remover o bloco RadioGroup atual (linhas ~418-448)
 *    - Adicionar o import: import GenreSelector from '@/components/GenreSelector';
 *    - Substituir por: <GenreSelector onGenreSelect={handleGenreSelection} selectedGenre={formData.genre} />
 * 
 * 2. Adicionar a função handleGenreSelection:
 *    const handleGenreSelection = (genreId: string, subGenreId?: string) => {
 *      // Lógica personalizada se necessário
 *      console.log('Gênero selecionado:', { genreId, subGenreId });
 *    };
 * 
 * 3. O componente já integra automaticamente com o musicStore via updateFormData
 * 
 * 4. Para validação, o campo formData.genre será preenchido automaticamente
 * 
 * BENEFÍCIOS DA INTEGRAÇÃO:
 * - Interface muito mais rica e intuitiva
 * - Busca e filtro de gêneros
 * - Navegação hierárquica (gênero → subgênero)
 * - Gêneros brasileiros e internacionais organizados
 * - Design responsivo e acessível
 * - Integração automática com o estado global
 */

export default GenreSelectorIntegrationExample;

/**
 * EXEMPLO DE SUBSTITUIÇÃO NO CÓDIGO ATUAL:
 * 
 * // ANTES (linhas ~418-448 em Criar.tsx):
 * <RadioGroup
 *   value={formData.genre}
 *   onValueChange={(value) => handleFieldUpdate('genre', value)}
 *   className="grid grid-cols-1 md:grid-cols-2 gap-4"
 * >
 *   {[
 *     { value: 'pop', label: 'Pop', description: 'Melodias cativantes e modernas' },
 *     { value: 'acoustic', label: 'Acústico', description: 'Intimista e emocional' },
 *     // ... outros gêneros
 *   ].map((genre) => (
 *     // ... JSX do RadioGroupItem
 *   ))}
 * </RadioGroup>
 * 
 * // DEPOIS:
 * <GenreSelector
 *   onGenreSelect={(genreId, subGenreId) => {
 *     console.log('Selecionado:', { genreId, subGenreId });
 *   }}
 *   selectedGenre={formData.genre}
 *   className="w-full"
 * />
 */