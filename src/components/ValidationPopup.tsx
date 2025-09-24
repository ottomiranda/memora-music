import React, { useState } from 'react';
import { useMusicStore } from '@/store/musicStore';
import { Button } from '@/components/ui/button';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { apiRequest } from '../config/api';

interface ValidationFormData {
  difficulty: number;
  recommendation: 'sim' | 'nao' | 'talvez' | '';
  price: '99' | '149' | '219' | '';
}

const ValidationPopup: React.FC = () => {
  const { completeMvpFlow } = useMusicStore();
  
  const [formData, setFormData] = useState<ValidationFormData>({
    difficulty: 5,
    recommendation: '',
    price: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDifficultyChange = (value: number) => {
    setFormData(prev => ({ ...prev, difficulty: value }));
  };

  const handleRecommendationChange = (value: 'sim' | 'nao' | 'talvez') => {
    setFormData(prev => ({ ...prev, recommendation: value }));
  };

  const handlePriceChange = (value: '99' | '149' | '219') => {
    setFormData(prev => ({ 
      ...prev, 
      price: value
    }));
  };

  const isFormValid = () => {
    return (
      formData.recommendation !== '' &&
      formData.price !== ''
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar dados para envio ao backend
      const priceWillingness = formData.price;
      
      const feedbackData = {
        difficulty: formData.difficulty,
        wouldRecommend: formData.recommendation === 'sim' ? true : false,
        priceWillingness: priceWillingness
      };

      console.log('[MVP] Enviando dados do formulário de validação:', feedbackData);
      
      // Enviar dados para o backend usando apiRequest centralizada
      const result = await apiRequest('/api/save-feedback', {
        method: 'POST',
        body: JSON.stringify(feedbackData)
      });
      
      console.log('[MVP] Feedback salvo com sucesso:', result);
      
      // Completar o fluxo MVP (marca como completo e fecha o popup)
      completeMvpFlow();
      
      console.log('[MVP] Fluxo de validação concluído com sucesso!');
      
    } catch (error) {
      console.error('[MVP] Erro ao enviar dados de validação:', error);
      // Aqui você pode adicionar uma notificação de erro para o usuário
      alert('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <LiquidGlassCard
        variant="primary"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 lg:p-8 border-white/30"
      >
        <div className="text-white space-y-8 pr-1 lg:pr-4">
          <header className="text-center space-y-3">
            <h2 className="text-2xl lg:text-3xl font-heading font-bold">
              Ajude-nos a evoluir a Memora Music
            </h2>
            <p className="text-white/70 text-sm max-w-xl mx-auto">
              Para liberar a música completa, responda a estas perguntas rápidas. Suas respostas nos ajudam a construir uma experiência melhor para você e toda a comunidade.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Pergunta A: Dificuldade */}
            <section className="space-y-4">
              <label className="block text-base lg:text-lg font-heading font-semibold">
                De 1 a 5, qual foi o nível de dificuldade para gerar sua música?
              </label>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1;
                  const selected = formData.difficulty === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleDifficultyChange(value)}
                      className={`h-12 rounded-xl border transition-all duration-200 backdrop-blur flex items-center justify-center font-medium ${
                        selected
                          ? 'border-white/60 bg-white/20 text-white shadow-[0_0_18px_rgba(255,255,255,0.35)]'
                          : 'border-white/20 bg-white/5 text-white/80 hover:border-white/40'
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-white/50">
                <span>Muito fácil</span>
                <span className="font-semibold text-white/80">{formData.difficulty}</span>
                <span>Muito difícil</span>
              </div>
            </section>

            {/* Pergunta B: Indicação */}
            <section className="space-y-4">
              <label className="block text-base lg:text-lg font-heading font-semibold">
                Você indicaria a Memora para um amigo ou parente?
              </label>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { value: 'sim', label: 'Sim, com certeza!' },
                  { value: 'talvez', label: 'Talvez, precisamos melhorar' },
                  { value: 'nao', label: 'Ainda não recomendaria' }
                ].map((option) => {
                  const selected = formData.recommendation === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleRecommendationChange(option.value as 'sim' | 'nao' | 'talvez')}
                      className={`rounded-2xl border p-4 text-sm text-left transition-all duration-200 backdrop-blur ${
                        selected
                          ? 'border-white/60 bg-white/20 text-white shadow-[0_10px_35px_rgba(90,45,176,0.35)]'
                          : 'border-white/15 bg-white/5 text-white/80 hover:border-white/35'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Pergunta C: Preço */}
            <section className="space-y-4">
              <label className="block text-base lg:text-lg font-heading font-semibold">
                Qual valor você considera justo para esta experiência?
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { value: '99', label: 'R$ 99,00' },
                  { value: '149', label: 'R$ 149,00' },
                  { value: '219', label: 'R$ 219,00' }
                ].map((option) => {
                  const selected = formData.price === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handlePriceChange(option.value as '99' | '149' | '219')}
                      className={`rounded-2xl border p-4 text-sm text-left transition-all duration-200 backdrop-blur ${
                        selected
                          ? 'border-white/60 bg-white/20 text-white shadow-[0_10px_35px_rgba(90,45,176,0.35)]'
                          : 'border-white/15 bg-white/5 text-white/80 hover:border-white/35'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>


            </section>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className="w-full h-12 bg-white/20 hover:bg-white/30 text-white font-heading font-semibold rounded-2xl transition-all duration-300 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                    Enviando...
                  </div>
                ) : (
                  'Enviar feedback e continuar'
                )}
              </Button>
              <p className="mt-3 text-center text-xs text-white/50">
                Obrigado por dedicar alguns segundos para melhorar a Memora Music.
              </p>
            </div>
          </form>
        </div>
      </LiquidGlassCard>
    </div>
  );
};

export default ValidationPopup;
