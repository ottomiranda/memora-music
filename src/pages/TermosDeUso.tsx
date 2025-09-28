import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../i18n/hooks/useTranslation';

const TermosDeUso: React.FC = () => {
  const { t } = useTranslation('legal');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header com botão de volta */}
      <div className="container mx-auto px-4 py-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common:navigation.backToHome', 'Voltar ao início')}
        </Link>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
            {t('termsOfUse.title', 'Termos de Uso – Memora Music')}
          </h1>
          
          <p className="text-white/80 text-center mb-8">
            {t('termsOfUse.lastUpdated')}
          </p>

          <div className="prose prose-invert max-w-none">
            <p className="text-white/90 text-lg leading-relaxed mb-8">
              {t('termsOfUse.introduction')}
            </p>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('termsOfUse.sections.acceptance.title')}</h2>
              <p className="text-white/90 leading-relaxed">
                {t('termsOfUse.sections.acceptance.content')}
              </p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('termsOfUse.sections.description.title')}</h2>
              <p className="text-white/90 leading-relaxed">
                {t('termsOfUse.sections.description.content')}
              </p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('termsOfUse.sections.userAccounts.title')}</h2>
              <p className="text-white/90 leading-relaxed">
                {t('termsOfUse.sections.userAccounts.content')}
              </p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('termsOfUse.sections.intellectualProperty.title')}</h2>
              <p className="text-white/90 leading-relaxed">
                {t('termsOfUse.sections.intellectualProperty.content')}
              </p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('termsOfUse.sections.prohibitedUses.title')}</h2>
              <p className="text-white/90 leading-relaxed">
                {t('termsOfUse.sections.prohibitedUses.content')}
              </p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('termsOfUse.sections.limitation.title')}</h2>
              <p className="text-white/90 leading-relaxed">
                {t('termsOfUse.sections.limitation.content')}
              </p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('termsOfUse.sections.modifications.title')}</h2>
              <p className="text-white/90 leading-relaxed">
                {t('termsOfUse.sections.modifications.content')}
              </p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('termsOfUse.sections.contact.title')}</h2>
              <p className="text-white/90 leading-relaxed">
                {t('termsOfUse.sections.contact.content')}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermosDeUso;