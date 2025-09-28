import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSupabaseBrowserClient } from '../lib/supabase-browser';
import { useAuthStore } from '../store/authStore';
import { useLocalizedRoutes } from '@/hooks/useLocalizedRoutes';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('authCallback');
  const { user, isLoggedIn } = useAuthStore();
  const { buildPath } = useLocalizedRoutes();
  const dashboardPath = buildPath('myMusic');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(3);

  const handleAuthCallback = async () => {
    try {
      const supabase = await getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error(t('error.messages.supabaseInit'));
      }

      // Processar o hash da URL para extrair tokens de autenticação
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro na sessão:', sessionError);
        throw sessionError;
      }

      if (sessionData.session) {
        console.log('Sessão encontrada:', sessionData.session.user);
        
        // Sincronizar sessão com o authStore
        const { syncSession } = useAuthStore.getState();
        const syncSuccess = await syncSession();
        
        if (!syncSuccess) {
          throw new Error(t('error.messages.sessionSync'));
        }
        
        setStatus('success');
        
        // Iniciar countdown para redirecionamento
        let timeLeft = 3;
        const countdownInterval = setInterval(() => {
          timeLeft -= 1;
          setCountdown(timeLeft);
          
          if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            navigate(dashboardPath, { replace: true });
          }
        }, 1000);
        
        return () => clearInterval(countdownInterval);
      } else {
        // Verificar se há parâmetros de erro na URL
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }
        
        throw new Error(t('error.messages.noSession'));
      }
    } catch (error) {
      console.error('Erro no callback de autenticação:', error);
      setStatus('error');
      
      let message = t('error.messages.unknown');
      if (error instanceof Error) {
        message = error.message;
      }
      
      // Personalizar mensagens de erro comuns
      if (message.includes('Email not confirmed')) {
        message = t('error.messages.emailNotConfirmed');
      } else if (message.includes('Invalid login credentials')) {
        message = t('error.messages.invalidCredentials');
      }
      
      setErrorMessage(message);
    }
  };

  useEffect(() => {
    handleAuthCallback();
  }, [dashboardPath, navigate]);

  // Se o usuário já estiver logado, redirecionar imediatamente
  useEffect(() => {
    if (isLoggedIn) {
      navigate(dashboardPath, { replace: true });
    }
  }, [dashboardPath, isLoggedIn, navigate]);

  const handleRetry = () => {
    setStatus('loading');
    setErrorMessage('');
    handleAuthCallback();
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleGoToLogin = () => {
    navigate('/?auth=login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h2 className="text-xl font-semibold text-gray-900">{t('loading.title')}</h2>
              <p className="text-gray-600">{t('loading.subtitle')}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <div className="rounded-full h-12 w-12 bg-green-100 mx-auto flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-green-900">{t('success.title')}</h2>
              <p className="text-green-700">{t('success.subtitle', { countdown })}</p>
              <button
                onClick={() => navigate(dashboardPath, { replace: true })}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {t('success.button')}
              </button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <div className="rounded-full h-12 w-12 bg-red-100 mx-auto flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-900">{t('error.title')}</h2>
              <p className="text-red-700 mb-4">{errorMessage}</p>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleRetry}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('error.buttons.retry')}
                </button>
                <button
                  onClick={handleGoToLogin}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t('error.buttons.login')}
                </button>
                <button
                  onClick={handleGoHome}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  {t('error.buttons.home')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
