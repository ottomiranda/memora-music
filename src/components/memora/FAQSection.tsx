import { useState } from "react";
import { ChevronDown, ChevronUp, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [formData, setFormData] = useState({
    difficulty: '',
    would_recommend: '',
    price_willingness: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const faqs = [
    {
      question: "Como a música é criada?",
      answer: "A IA transforma sua história em letra e melodia exclusivas. Você conta sua história, descreve a ocasião e os sentimentos, e nossa inteligência artificial cria uma música única em menos de 5 minutos."
    },
    {
      question: "Posso escolher o estilo musical?",
      answer: "Sim, você escolhe entre vários estilos populares como pop, romântico, infantil, sertanejo, rock, MPB e muitos outros. Cada estilo é adaptado para criar a atmosfera perfeita para sua ocasião especial."
    },
    {
      question: "Quanto tempo demora?",
      answer: "Menos de 5 minutos na maioria dos casos. Após você fornecer as informações sobre sua história, nossa IA processa e gera sua música personalizada rapidamente, para que você possa ouvir e compartilhar no mesmo dia."
    }
  ];

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
      const response = await fetch('/api/mvp-feedback', {
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

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* FAQ Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-memora-black mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-xl text-memora-gray max-w-3xl mx-auto">
              Tire suas dúvidas sobre como criar sua música personalizada
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-memora-gray-light/30 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-memora-gray-light/50 transition-colors duration-200"
                  aria-expanded={openFAQ === index}
                >
                  <h3 className="text-lg font-heading font-bold text-memora-black pr-4">
                    {faq.question}
                  </h3>
                  {openFAQ === index ? (
                    <ChevronUp className="w-6 h-6 text-memora-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-memora-primary flex-shrink-0" />
                  )}
                </button>
                
                {openFAQ === index && (
                  <div className="px-6 pb-6">
                    <p className="text-memora-gray leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* MVP Validation Form */}
        <div className="bg-gradient-to-br from-memora-primary/5 to-memora-secondary/5 rounded-3xl p-8 lg:p-12 border border-memora-primary/10">
          <div className="text-center mb-8">
            <h3 className="text-2xl lg:text-3xl font-heading font-bold text-memora-black mb-4">
              Ajude-nos a melhorar a Memora Music
            </h3>
            <p className="text-memora-gray max-w-2xl mx-auto">
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
              <p className="text-memora-gray">
                Suas respostas nos ajudarão a criar uma experiência ainda melhor.
              </p>
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
                  className="bg-memora-primary hover:bg-memora-primary/90 disabled:bg-memora-gray/50 text-white font-heading font-bold py-4 px-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:hover:scale-100 disabled:hover:shadow-none flex items-center space-x-2 mx-auto"
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
    </section>
  );
};

export default FAQSection;