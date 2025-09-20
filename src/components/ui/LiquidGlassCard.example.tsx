import React from 'react';
import { LiquidGlassCard } from './LiquidGlassCard';

/**
 * Exemplo de uso do componente LiquidGlassCard
 * Este arquivo demonstra as diferentes variantes e tamanhos disponíveis
 */
export const LiquidGlassCardExample = () => {
  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 min-h-screen">
      <h1 className="text-white text-3xl font-bold text-center mb-12">
        Exemplos do LiquidGlassCard
      </h1>
      
      {/* Variante Primary */}
      <div className="space-y-4">
        <h2 className="text-white text-xl font-semibold">Variante Primary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LiquidGlassCard variant="primary" size="sm">
            <h3 className="text-white font-semibold mb-2">Card Pequeno</h3>
            <p className="text-white/80 text-sm">Este é um exemplo de card pequeno com variante primary.</p>
          </LiquidGlassCard>
          
          <LiquidGlassCard variant="primary" size="md">
            <h3 className="text-white font-semibold mb-2">Card Médio</h3>
            <p className="text-white/80">Este é um exemplo de card médio com variante primary.</p>
          </LiquidGlassCard>
          
          <LiquidGlassCard variant="primary" size="lg">
            <h3 className="text-white font-semibold mb-2">Card Grande</h3>
            <p className="text-white/80">Este é um exemplo de card grande com variante primary.</p>
          </LiquidGlassCard>
        </div>
      </div>
      
      {/* Variante Secondary */}
      <div className="space-y-4">
        <h2 className="text-white text-xl font-semibold">Variante Secondary</h2>
        <LiquidGlassCard variant="secondary" size="md">
          <h3 className="text-white font-semibold mb-2">Card Secondary</h3>
          <p className="text-white/80">Este é um exemplo de card com variante secondary, ideal para conteúdo secundário.</p>
        </LiquidGlassCard>
      </div>
      
      {/* Variante Coral */}
      <div className="space-y-4">
        <h2 className="text-white text-xl font-semibold">Variante Coral</h2>
        <LiquidGlassCard variant="coral" size="md">
          <h3 className="text-white font-semibold mb-2">Card Coral</h3>
          <p className="text-white/80">Este é um exemplo de card com variante coral, com tons quentes e acolhedores.</p>
        </LiquidGlassCard>
      </div>
      
      {/* Card Customizado */}
      <div className="space-y-4">
        <h2 className="text-white text-xl font-semibold">Card Customizado</h2>
        <LiquidGlassCard 
          variant="primary" 
          size="lg" 
          className="max-w-2xl mx-auto text-center"
        >
          <h3 className="text-white font-bold text-2xl mb-4">Gostou do que ouviu?</h3>
          <p className="text-white/80 mb-6">
            Crie suas próprias músicas com nossa plataforma de IA avançada.
          </p>
          <button className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full transition-colors">
            Criar sua música
          </button>
        </LiquidGlassCard>
      </div>
    </div>
  );
};

export default LiquidGlassCardExample;