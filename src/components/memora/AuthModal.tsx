import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, X, Mail, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { PurpleFormButton } from "@/components/ui/PurpleFormButton";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { getAuthSchema, type AuthFormData } from "@/schemas/authSchema";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  // Estados locais
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  const { login, signup, isLoading, error, clearError, resetPassword, isLoggedIn, resendConfirmationEmail } = useAuthStore()
  const { hideAuthPopup, executeAuthCallback } = useUiStore();

  // Monitorar mudanças na autenticação para fechar o modal automaticamente
  useEffect(() => {
    if (isLoggedIn && showEmailConfirmation) {
      hideAuthPopup();
      executeAuthCallback();
      onClose();
      // Redirecionar para o dashboard após verificação bem-sucedida
      window.location.href = '/minhas-musicas';
    }
  }, [isLoggedIn, showEmailConfirmation, hideAuthPopup, executeAuthCallback, onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Monitorar confirmação de email e redirecionar automaticamente
  useEffect(() => {
    if (showEmailConfirmation && isLoggedIn) {
      // Se o usuário está logado, significa que o email foi confirmado
      setTimeout(() => {
        handleCloseModal();
      }, 2000); // Aguarda 2 segundos para mostrar feedback antes de redirecionar
    }
  }, [showEmailConfirmation, isLoggedIn]);

  // Configuração do react-hook-form com validação zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<AuthFormData>({
    resolver: zodResolver(getAuthSchema(isLogin)),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      ...(isLogin ? {} : { name: '' })
    }
  });



  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    // TODO: Implementar autenticação com Google
    // Por enquanto, simular login bem-sucedido
    const success = await login({ email: "google@user.com", password: "google" });
    if (success) {
      executeAuthCallback();
      hideAuthPopup();
      onClose();
    }
  };

  const handleEmailAuth = async (data: AuthFormData) => {
    clearError();
    
    try {
      if (isLogin) {
        await login({ 
          email: data.email, 
          password: data.password 
        });
        executeAuthCallback();
        hideAuthPopup();
        onClose();
        // Limpar formulário
        reset();
      } else {
        const signupData = data as { name: string; email: string; password: string };
        await signup({ 
          email: signupData.email, 
          password: signupData.password, 
          name: signupData.name 
        });
        // Após signup, mostrar tela de confirmação de email
        setUserEmail(data.email);
        setShowEmailConfirmation(true);
      }
    } catch (error) {
      // O erro já foi tratado pelo authStore e está no estado 'error'
      // Não precisamos fazer nada aqui, pois o erro será exibido automaticamente
    }
  };

  const handleForgotPassword = async () => {
    const email = watch('email');
    if (!email) {
      // precise, mas não dependemos de toast aqui
      alert('Informe seu e-mail para recuperar a senha.');
      return;
    }
    const ok = await resetPassword(email);
    if (ok) {
      alert('Enviamos um e-mail com instruções para redefinir sua senha.');
    }
  };

  const handleResendEmail = async () => {
    if (!userEmail) return;
    
    try {
      const success = await resendConfirmationEmail(userEmail);
      if (success) {
        // Mostrar feedback de sucesso temporário
        const button = document.querySelector('[data-resend-button]') as HTMLButtonElement;
        if (button) {
          const originalText = button.textContent;
          button.textContent = 'E-mail enviado!';
          button.disabled = true;
          setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Erro ao reenviar email:', error);
      // Mostrar feedback de erro temporário
      const button = document.querySelector('[data-resend-button]') as HTMLButtonElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Erro ao enviar';
        setTimeout(() => {
          button.textContent = originalText;
        }, 3000);
      }
    }
  };

  const handleCloseModal = () => {
    setShowEmailConfirmation(false);
    hideAuthPopup();
    onClose();
    // Redirecionar para /minhas-musicas se o usuário estiver logado
    if (isLoggedIn) {
      window.location.href = '/minhas-musicas';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      <LiquidGlassCard
        variant="primary"
        className="relative w-full max-w-lg sm:max-w-md mx-auto border-white/25 p-5 sm:p-6"
      >
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white/70 hover:text-white"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="text-center mb-5 sm:mb-6 text-white space-y-2">
          <h2 className="text-xl sm:text-2xl font-heading font-bold">
            {isLogin ? "Entre na sua conta" : "Criar nova conta"}
          </h2>
          <p className="text-white/70 text-xs sm:text-sm">
            {isLogin
              ? "Acesse suas músicas personalizadas e continue criando memórias."
              : "Comece agora mesmo a transformar sentimentos em música."}
          </p>
        </div>

        <Button
          onClick={handleGoogleAuth}
          variant="ghost"
          className="w-full mb-5 h-11 rounded-2xl border border-white/20 bg-white/10 text-white font-medium hover:bg-white/15"
          data-attr={isLogin ? "google-login" : "google-signup"}
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar com Google
        </Button>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/15" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] text-white/50">
            <span className="px-2.5 bg-white/5 rounded-full py-0.5">ou</span>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-2xl border border-red-300/40 bg-red-500/10 p-3 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(handleEmailAuth)} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="name" className="text-white font-medium">
                Nome completo
              </Label>
              <Input
                id="name"
                type="text"
                {...register('name')}
                className="mt-1.5 h-11 rounded-2xl border border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-white/40"
                placeholder="Seu nome"
              />
              {errors.name && (
                <p className="text-red-200 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>
          )}
          
          <div>
            <Label htmlFor="email" className="text-white font-medium">
              E-mail
            </Label>
            <div className="relative mt-1.5">
              <Input
                id="email"
                type="email"
                {...register('email')}
                className="h-11 rounded-2xl border border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-white/40 pl-11"
                placeholder="seu@email.com"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            </div>
            {errors.email && (
              <p className="text-red-200 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password" className="text-white font-medium">
              Senha
            </Label>
            <div className="relative mt-1.5">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register('password')}
                className="h-11 rounded-2xl border border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-white/40 pr-11"
                placeholder="Sua senha"
              />
              <Button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white h-auto w-auto p-0"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-red-200 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <PurpleFormButton
            type="submit"
            disabled={isLoading}
            className="w-full h-11 flex items-center justify-center text-sm"
            data-attr={isLogin ? "email-login" : "email-signup"}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isLogin ? "Entrando..." : "Criando conta..."}
              </div>
            ) : (
              isLogin ? "Entrar" : "Criar conta"
            )}
          </PurpleFormButton>
        </form>

        <div className="text-center mt-6 text-white/70 text-xs sm:text-sm">
          <p>
            {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
            <Button
              onClick={() => {
                const newIsLogin = !isLogin;
                setIsLogin(newIsLogin);
                clearError();
                // Reset do formulário com novos valores padrão baseados no modo
                reset({
                  email: '',
                  password: '',
                  ...(newIsLogin ? {} : { name: '' })
                });
              }}
              variant="link"
              className="ml-1 text-white font-semibold p-0 h-auto hover:text-white/80"
            >
              {isLogin ? "Criar conta" : "Entrar"}
            </Button>
          </p>
          {isLogin && (
            <div className="mt-1.5">
              <Button
                type="button"
                variant="link"
                className="text-white/80 hover:text-white font-medium p-0 h-auto"
                onClick={handleForgotPassword}
              >
                Esqueci minha senha
              </Button>
            </div>
          )}
        </div>

        {showEmailConfirmation && (
          <LiquidGlassCard
            variant="primary"
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 sm:p-7 border-white/30"
          >
            <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center mb-5">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-heading font-bold text-white mb-2">Confirme seu e-mail</h3>
            <p className="text-white/70 max-w-sm text-sm mb-3">
              Enviamos um link de ativação para:
            </p>
            <p className="text-white font-semibold text-sm mb-4">{userEmail}</p>
            <p className="text-xs sm:text-sm text-white/60 max-w-md mb-6">
              Assim que você confirmar, carregaremos automaticamente sua conta para continuar criando sem interrupções.
            </p>

            <div className="w-full max-w-sm space-y-2.5">
              <PurpleFormButton
                onClick={handleResendEmail}
                disabled={isLoading}
                className="w-full h-10 flex items-center justify-center text-sm"
                data-resend-button
              >
                {isLoading ? 'Reenviando...' : 'Reenviar e-mail'}
              </PurpleFormButton>
              <Button
                onClick={handleCloseModal}
                variant="ghost"
                className="w-full text-white/70 hover:text-white text-sm"
              >
                Fechar
              </Button>
            </div>

            <div className="mt-4 flex items-center text-xs sm:text-sm text-white/60">
              <CheckCircle className="w-4 h-4 mr-2 text-memora-primary" />
              Monitorando confirmação automaticamente...
            </div>
          </LiquidGlassCard>
        )}
      </LiquidGlassCard>
    </div>
  );
};

export default AuthModal;
