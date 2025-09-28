import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from 'react-i18next';
import SectionTitle from '../ui/SectionTitle';
import SectionSubtitle from '../ui/SectionSubtitle';
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";

const FAQSection = () => {
  const { t } = useTranslation('common');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqKeys = [
    'howMusicIsCreated',
    'availableStyles', 
    'pricing',
    'deliveryTime',
    'sharing'
  ];

  const faqs = faqKeys.map(key => ({
    question: t(`faq.questions.${key}.question`),
    answer: t(`faq.questions.${key}.answer`)
  }));

  // Feedback form migrated to modal triggered from footer

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section id="faq" className="py-[120px]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* FAQ Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <SectionTitle>
              {t('faq.title')}
            </SectionTitle>
            <SectionSubtitle>{t('faq.subtitle')}</SectionSubtitle>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={faq.question}>
                <LiquidGlassCard
                  variant="primary"
                  className="overflow-hidden transition-all duration-300 cursor-pointer"
                  onClick={() => toggleFAQ(index)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={openFAQ === index}
                  aria-controls={`faq-content-${index}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleFAQ(index);
                    }
                  }}
                >
                  <div className="w-full px-6 py-6 flex items-center justify-between transition-all duration-200">
                    <h3 className="text-lg font-heading font-bold text-white pr-4">
                      {faq.question}
                    </h3>
                    <div className={`transition-transform duration-200 ${openFAQ === index ? 'rotate-180' : 'rotate-0'}`}>
                      <ChevronDown className="w-6 h-6 text-white flex-shrink-0" />
                    </div>
                  </div>
                  
                  <div 
                    id={`faq-content-${index}`}
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openFAQ === index 
                        ? 'max-h-96 opacity-100' 
                        : 'max-h-0 opacity-0'
                    }`}
                    aria-hidden={openFAQ !== index}
                  >
                    <div className="px-6 pb-6">
                      <p className="text-white/70 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </LiquidGlassCard>
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
