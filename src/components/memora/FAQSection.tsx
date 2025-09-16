import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

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

  // Feedback form migrated to modal triggered from footer

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className="py-20 bg-background dark:bg-neutral-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* FAQ Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground dark:text-white mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-xl text-muted-foreground dark:text-white/80 max-w-3xl mx-auto">
              Tire suas dúvidas sobre como criar sua música personalizada
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg bg-white/70 dark:bg-white/10 border border-black/5 dark:border-white/10"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200"
                  aria-expanded={openFAQ === index}
                >
                  <h3 className="text-lg font-heading font-bold text-foreground dark:text-white pr-4">
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
                    <p className="text-muted-foreground dark:text-white/80 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* MVP Validation removed from page. Now available via footer modal. */}
      </div>
    </section>
  );
};

export default FAQSection;
