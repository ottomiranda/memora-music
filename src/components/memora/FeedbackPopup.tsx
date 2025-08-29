import { useState } from "react";
import { X, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "../../config/api";

interface FeedbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackPopup = ({ isOpen, onClose }: FeedbackPopupProps) => {
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
    { value: '219', label: 'R$ 219,00' },
    { value: 'other', label: 'Outro valor' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.difficulty || !formData.would_recommend || !formData.price_willingness) {
      toast.error('Por favor, responda todas as perguntas');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = `${API_BASE_URL}/api/mvp-feedback`;
      console.log('[MVP] Enviando feedback para:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          difficulty: parseInt(formData.difficulty),
          would_recommend: formData.would_recommend === 'sim',
          price_willingness: formData.price_willingness === 'other' ? 0 : parseFloat(formData.price_willingness)
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast.success('Obrigado pelo seu feedback! Suas respostas são muito importantes para nós.');
      } else {
        throw new Error('Erro ao enviar feedback');
      }
    } catch (error) {
      toast.error('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
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
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl p-6 lg:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50"
          aria-label="Fechar popup"
        >
          <X className="w-6 h-6 text-memora-gray" />
        </button>

        {/* Content */}
        <div className="pr-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl lg:text-3xl font-heading font-bold text-memora-black mb-4">
              Ajude-nos a melhorar a Memora Music
            </h3>
            <p className="text-memora-gray max-w-xl mx-auto">
              Sua opinião é fundamental para criarmos a melhor experiência possível. Responda algumas perguntas rápidas:
            </p>
          </div>

          {isSubmitted ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h4 className="text-2xl font-heading font-bold text-memora-black mb-4">
                Obrigado pelo seu feedback!
              </h4>
              <p className="text-memora-gray mb-6">
                Suas respostas nos ajudarão a criar uma experiência ainda melhor.
              </p>
              <button
                onClick={handleClose}
                className="bg-memora-primary hover:bg-memora-primary/90 text-white font-heading font-bold py-3 px-6 rounded-xl transition-all duration-300"
              >
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Question 1: Difficulty */}
              <div>
                <label className="block text-lg font-heading font-bold text-memora-black mb-4">
                  De 1 a 10, qual foi o nível de dificuldade para gerar sua música?
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {[...Array(10)].map((_, i) => {
                    const value = (i + 1).toString();
                    return (
                      <label key={i} className="relative">
                        <input
                          type="radio"
                          name="difficulty"
                          value={value}
                          checked={formData.difficulty === value}
                          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                          className="sr-only"
                        />
                        <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                          formData.difficulty === value
                            ? 'border-memora-primary bg-memora-primary text-white'
                            : 'border-memora-gray/30 hover:border-memora-primary/50 text-memora-gray'
                        }`}>
                          {i + 1}
                        </div>
                      </label>
                    );
                  })}
                </div>
                <div className="flex justify-between text-sm text-memora-gray mt-2">
                  <span>Muito fácil</span>
                  <span>Muito difícil</span>
                </div>
              </div>

              {/* Question 2: Recommendation */}
              <div>
                <label className="block text-lg font-heading font-bold text-memora-black mb-4">
                  Você indicaria a Memora para um amigo ou parente?
                </label>
                <div className="grid sm:grid-cols-3 gap-4">
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
                      <div className={`p-4 rounded-2xl border-2 text-center cursor-pointer transition-all duration-200 ${
                        formData.would_recommend === option.value
                          ? 'border-memora-primary bg-memora-primary text-white'
                          : 'border-memora-gray/30 hover:border-memora-primary/50 text-memora-gray'
                      }`}>
                        <span className="font-heading font-bold">{option.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Question 3: Price Willingness */}
              <div>
                <label className="block text-lg font-heading font-bold text-memora-black mb-4">
                  Quanto você estaria disposto a pagar por uma música completa e personalizada?
                </label>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <div className={`p-4 rounded-2xl border-2 text-center cursor-pointer transition-all duration-200 ${
                        formData.price_willingness === option.value
                          ? 'border-memora-primary bg-memora-primary text-white'
                          : 'border-memora-gray/30 hover:border-memora-primary/50 text-memora-gray'
                      }`}>
                        <span className="font-heading font-bold">{option.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-memora-primary hover:bg-memora-primary/90 disabled:bg-memora-gray/50 text-white font-heading font-bold py-4 px-8 rounded-xl transition-all duration-300 disabled:hover:scale-100 flex items-center space-x-2 mx-auto"
                  data-attr="mvp-feedback-submit"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Enviar feedback</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPopup;