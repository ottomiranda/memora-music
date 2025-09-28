import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation('common');

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen pt-40 flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-heading mb-4">{t('pages.notFound.title')}</h1>
        <p className="text-xl text-gray-600 mb-4">{t('pages.notFound.message')}</p>
        <Link 
          to="/" 
          className="bg-memora-primary text-white px-6 py-2 rounded-2xl hover:bg-memora-primary/90 transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          {t('pages.notFound.button')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
