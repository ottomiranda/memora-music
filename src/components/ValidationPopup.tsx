import React, { useState } from 'react';
import { useMusicStore } from '@/store/musicStore';
import { X } from 'lucide-react';

interface ValidationFormData {
  difficulty: number;
  recommendation: 'sim' | 'nao' | 'talvez' | '';
  price: '99' | '149' | '219' | 'outro' | '';
  customPrice: string;
}

const ValidationPopup: React.FC = () => {
  const { completeMvpFlow } = useMusicStore();
  
  const [formData, setFormData] = useState<ValidationFormData>({
    difficulty: 5,
    recommendation: '',
    price: '',
    customPrice: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDifficultyChange = (value: number) => {
    setFormData(prev => ({ ...prev, difficulty: value }));
  };

  const handleRecommendationChange = (value: 'sim' | 'nao' | 'talvez') => {
    setFormData(prev => ({ ...prev, recommendation: value }));
  };

  const handlePriceChange = (value: '99' | '149' | '219' | 'outro') => {
    setFormData(prev => ({ 
      ...prev, 
      price: value,
      customPrice: value !== 'outro' ? '' : prev.customPrice
    }));
  };

  const handleCustomPriceChange = (value: string) => {
    setFormData(prev => ({ ...prev, customPrice: value }));
  };

  const isFormValid = () => {
    return (
      formData.recommendation !== '' &&
      formData.price !== '' &&
      (formData.price !== 'outro' || formData.customPrice.trim() !== '')
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
      let priceWillingness = '';
      if (formData.price === 'outro') {
        priceWillingness = formData.customPrice;
      } else {
        // Mapear valores do formulário para formato esperado pela API
        const priceMap: { [key: string]: string } = {
          '99': '99',
          '149': '149', 
          '219': '219'
        };
        priceWillingness = priceMap[formData.price] || formData.price;
      }
      
      const feedbackData = {
        difficulty: formData.difficulty,
        wouldRecommend: formData.recommendation === 'sim' ? true : false,
        priceWillingness: priceWillingness
      };

      console.log('[MVP] Enviando dados do formulário de validação:', feedbackData);
      
      // Enviar dados para o backend
      const response = await fetch('/api/save-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-bold text-gray-800">
              Ajude-nos a melhorar!
            </h2>
            {/* Removido botão de fechar para tornar o modal obrigatório */}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pergunta A: Dificuldade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Como você avalia a dificuldade de usar nossa plataforma?
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.difficulty}
                  onChange={(e) => handleDifficultyChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 (Muito fácil)</span>
                  <span className="font-medium text-blue-600">{formData.difficulty}</span>
                  <span>5 (Muito difícil)</span>
                </div>
              </div>
            </div>

            {/* Pergunta B: Indicação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Você indicaria nossa plataforma para um amigo?
              </label>
              <div className="space-y-2">
                {[
                  { value: 'sim', label: 'Sim, com certeza!' },
                  { value: 'talvez', label: 'Talvez, precisa melhorar' },
                  { value: 'nao', label: 'Não, não recomendaria' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="recommendation"
                      value={option.value}
                      checked={formData.recommendation === option.value}
                      onChange={() => handleRecommendationChange(option.value as 'sim' | 'nao' | 'talvez')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pergunta C: Preço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quanto você pagaria por este serviço?
              </label>
              <div className="space-y-2">
                {[
                  { value: '99', label: 'R$ 99,00' },
                  { value: '149', label: 'R$ 149,00' },
                  { value: '219', label: 'R$ 219,00' },
                  { value: 'outro', label: 'Outro valor' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      value={option.value}
                      checked={formData.price === option.value}
                      onChange={() => handlePriceChange(option.value as '99' | '149' | '219' | 'outro')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
              
              {/* Campo condicional para "Outro valor" */}
              {formData.price === 'outro' && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Digite o valor (ex: R$ 299,00)"
                    value={formData.customPrice}
                    onChange={(e) => handleCustomPriceChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Botão de envio */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enviando...
                  </div>
                ) : (
                  'Enviar Feedback'
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 text-xs text-gray-500 text-center">
            Suas respostas nos ajudam a melhorar a experiência para todos os usuários.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationPopup;