import { useState } from "react";
import { X, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "../../config/api";
import { Button } from '@/components/ui/button';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { PurpleFormButton } from '@/components/ui/PurpleFormButton';
import { LiquidGlassButtonSmall } from '@/components/ui/LiquidGlassButtonSmall';

export interface FeedbackSubmissionPayload {
  difficulty: number;
  difficultyRaw: string;
  wouldRecommend: boolean;
  recommendationRaw: string;
  priceRaw: string;
  priceNumeric: number;
}

interface FeedbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
  disableClose?: boolean;
  submitFeedback?: (payload: FeedbackSubmissionPayload) => Promise<void>;
  onSubmitSuccess?: () => void;
}

const FeedbackPopup = ({
  isOpen,
  onClose,
  disableClose = false,
  submitFeedback,
  onSubmitSuccess,
}: FeedbackPopupProps) => {
  const [formData, setFormData] = useState({
    difficulty: '',
    would_recommend: '',
    price_willingness: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const priceOptions = [
    { value: '99', label: 'R$ 99,00' },
    { value: '149', label: 'R$ 149,00' },
    { value: '219', label: 'R$ 219,00' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.difficulty || !formData.would_recommend || !formData.price_willingness) {
      toast.error('Por favor, responda todas as perguntas');
      return;
    }

    const difficulty = parseInt(formData.difficulty, 10);
    const priceNumeric = parseFloat(formData.price_willingness);
    const payload: FeedbackSubmissionPayload = {
      difficulty: Number.isNaN(difficulty) ? 0 : difficulty,
      difficultyRaw: formData.difficulty,
      wouldRecommend: formData.would_recommend === 'sim',
      recommendationRaw: formData.would_recommend,
      priceRaw: formData.price_willingness,
      priceNumeric: Number.isNaN(priceNumeric) ? 0 : priceNumeric,
    };

    setIsSubmitting(true);

    try {
      if (submitFeedback) {
        await submitFeedback(payload);
      } else {
        const url = `${API_BASE_URL}/api/mvp-feedback`;
        console.log('[MVP] Enviando feedback para:', url);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            difficulty: payload.difficulty,
            would_recommend: payload.wouldRecommend,
            price_willingness: payload.priceNumeric
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao enviar feedback');
        }
      }

      setIsSubmitted(true);
      toast.success('Obrigado pelo seu feedback! Suas respostas são muito importantes para nós.');
      onSubmitSuccess?.();
    } catch (error) {
      toast.error('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    if (disableClose && !isSubmitted) {
      return;
    }

    onClose();

    // Reset form after closing
    setTimeout(() => {
      setFormData({
        difficulty: '',
        would_recommend: '',
        price_willingness: ''
      });
      setIsSubmitted(false);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!disableClose || isSubmitted ? handleClose : undefined}
      />
      
      {/* Modal */}
      <LiquidGlassCard
        variant="primary"
        className={`relative w-full ${isSubmitted ? 'max-w-md sm:max-w-lg px-6 sm:px-7 py-6 sm:py-7' : 'max-w-3xl px-8 sm:px-12 py-6 sm:py-8'} border-white/25`}
      >
        {/* Close Button */}
        {(!disableClose || isSubmitted) && (
          <Button
            onClick={handleClose}
            disabled={isSubmitting}
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white transition-colors duration-200 disabled:opacity-50 h-auto"
            aria-label="Fechar popup"
          >
            <X className="w-6 h-6" />
          </Button>
        )}

        {/* Content */}
        <div className="text-white space-y-6">
          {!isSubmitted && (
            <div className="text-center space-y-2">
              <h3 className="text-xs sm:text-sm font-heading font-semibold tracking-[0.24em] uppercase text-white/80">
                Ajude-nos a melhorar a Memora Music
              </h3>
              <p className="text-white/70 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed">
                Sua opinião é fundamental para criarmos a melhor experiência possível. Responda algumas perguntas rápidas:
              </p>
            </div>
          )}

          {isSubmitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-400/15 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-9 h-9 text-green-300" />
              </div>
              <h4 className="text-lg font-heading font-semibold">
                Obrigado pelo seu feedback!
              </h4>
              <p className="text-white/70 text-sm">
                Suas respostas nos ajudarão a criar uma experiência ainda melhor.
              </p>
              <LiquidGlassButtonSmall
                onClick={handleClose}
                className="mx-auto px-6 text-sm"
                type="button"
              >
                Fechar
              </LiquidGlassButtonSmall>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question 1: Difficulty */}
              <div>
                <label className="block text-xs sm:text-[15px] font-heading text-white/85 mb-2">
                  De 1 a 10, qual foi o nível de dificuldade para gerar sua música?
                </label>
                <div className="space-y-1">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {[...Array(10)].map((_, i) => {
                      const value = (i + 1).toString();
                      const isSelected = formData.difficulty === value;
                      return (
                        <label key={i} className="relative">
                          <input
                            type="radio"
                            name="difficulty"
                            value={value}
                            checked={isSelected}
                            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                            className="sr-only"
                          />
                          {isSelected ? (
                            <PurpleFormButton className="pointer-events-none w-full h-10 sm:h-11 flex items-center justify-center text-xs sm:text-sm font-heading">
                              {i + 1}
                            </PurpleFormButton>
                          ) : (
                            <div className="p-2.5 sm:p-3 rounded-2xl border border-white/20 bg-white/8 text-white/70 hover:border-white/35 text-xs sm:text-sm text-center cursor-pointer transition-all duration-200 backdrop-blur font-heading">
                              {i + 1}
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  <div className="relative h-4">
                    <div className="absolute inset-0 flex justify-between text-[10px] text-white/50">
                      <span>Muito fácil</span>
                      <span>Muito difícil</span>
                    </div>
                    <span className="absolute left-1/2 -translate-x-1/2 text-[10px] text-white/60">Neutro</span>
                  </div>
                </div>
              </div>

              {/* Question 2: Recommendation */}
              <div>
                <label className="block text-xs sm:text-[15px] font-heading text-white/85 mb-2">
                  Você indicaria a Memora para um amigo ou parente?
                </label>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { value: 'sim', label: 'Sim', color: 'green' },
                    { value: 'nao', label: 'Não', color: 'red' },
                    { value: 'talvez', label: 'Talvez', color: 'yellow' }
                  ].map((option) => (
                    <label key={option.value} className="relative">
                      <input
                        type="radio"
                        name="would_recommend"
                        value={option.value}
                        checked={formData.would_recommend === option.value}
                        onChange={(e) => setFormData({ ...formData, would_recommend: e.target.value })}
                        className="sr-only"
                      />
                      {formData.would_recommend === option.value ? (
                        <PurpleFormButton className="pointer-events-none w-full h-11 flex items-center justify-center text-sm font-heading">
                          {option.label}
                        </PurpleFormButton>
                      ) : (
                        <div className="p-3 rounded-2xl border border-white/20 bg-white/5 text-white/70 hover:border-white/40 text-sm text-center cursor-pointer transition-all duration-200 backdrop-blur font-heading">
                          {option.label}
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Question 3: Price Willingness */}
              <div>
                <label className="block text-xs sm:text-[15px] font-heading text-white/85 mb-2">
                  Quanto você estaria disposto a pagar por uma música completa e personalizada?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {priceOptions.map((option) => (
                    <label key={option.value} className="relative">
                      <input
                        type="radio"
                        name="price_willingness"
                        value={option.value}
                        checked={formData.price_willingness === option.value}
                        onChange={(e) => setFormData({ ...formData, price_willingness: e.target.value })}
                        className="sr-only"
                      />
                      {formData.price_willingness === option.value ? (
                        <PurpleFormButton className="pointer-events-none w-full h-11 flex items-center justify-center text-sm font-heading">
                          {option.label}
                        </PurpleFormButton>
                      ) : (
                        <div className="p-3 rounded-2xl border border-white/20 bg-white/5 text-white/70 hover:border-white/40 text-sm text-center cursor-pointer transition-all duration-200 backdrop-blur font-heading">
                          {option.label}
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-4">
                <LiquidGlassButtonSmall
                  type="submit"
                  disabled={isSubmitting}
                  className="mx-auto flex h-11 items-center justify-center gap-2 px-10 text-sm"
                  data-attr="mvp-feedback-submit"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar feedback</span>
                    </>
                  )}
                </LiquidGlassButtonSmall>
              </div>
            </form>
          )}
        </div>
      </LiquidGlassCard>
    </div>
  );
};

export default FeedbackPopup;
