import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../i18n/hooks/useTranslation';

const PoliticaDePrivacidade: React.FC = () => {
  const { t } = useTranslation('legal');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Botão de voltar */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t('common:navigation.backToHome', 'Voltar ao início')}
        </Link>

        {/* Conteúdo principal */}
        <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
            {t('privacyPolicy.title')}
          </h1>
          
          <p className="text-white/80 text-center mb-8">
            {t('privacyPolicy.lastUpdated')}
          </p>

          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-white/90 text-lg leading-relaxed mb-8">
              {t('privacyPolicy.introduction')}
            </p>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('privacyPolicy.sections.introduction.title')}</h2>
              <p className="text-white/90 mb-4">{t('privacyPolicy.sections.introduction.content')}</p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('privacyPolicy.sections.dataCollection.title')}</h2>
              <p className="text-white/90 mb-4">{t('privacyPolicy.sections.dataCollection.content')}</p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('privacyPolicy.sections.dataUse.title')}</h2>
              <p className="text-white/90 mb-4">{t('privacyPolicy.sections.dataUse.content')}</p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('privacyPolicy.sections.dataSharing.title')}</h2>
              <p className="text-white/90 mb-4">{t('privacyPolicy.sections.dataSharing.content')}</p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('privacyPolicy.sections.dataSecurity.title')}</h2>
              <p className="text-white/90 mb-4">{t('privacyPolicy.sections.dataSecurity.content')}</p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('privacyPolicy.sections.userRights.title')}</h2>
              <p className="text-white/90 mb-4">{t('privacyPolicy.sections.userRights.content')}</p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('privacyPolicy.sections.changes.title')}</h2>
              <p className="text-white/90 mb-4">{t('privacyPolicy.sections.changes.content')}</p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('privacyPolicy.sections.contact.title')}</h2>
              <p className="text-white/90 mb-4">{t('privacyPolicy.sections.contact.content')}</p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('privacyPolicy.sections.cookies.title')}</h2>
              <p className="text-white/90 mb-4">{t('privacyPolicy.sections.cookies.content')}</p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{t('privacyPolicy.sections.changes.title')}</h2>
              <p className="text-white/90 mb-4">{t('privacyPolicy.sections.changes.content')}</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliticaDePrivacidade;