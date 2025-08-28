import { useState } from "react";
import { X, Mail, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  const { login, signup, isLoading, error, clearError } = useAuthStore();
  const { hideAuthPopup, executeAuthCallback } = useUiStore();

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    // TODO: Implementar autenticação com Google
    console.log("Autenticação com Google");
    // Por enquanto, simular login bem-sucedido
    const success = await login({ email: "google@user.com", password: "google" });
    if (success) {
      executeAuthCallback();
      hideAuthPopup();
      onClose();
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    let success = false;
    
    if (isLogin) {
      console.log('[DEBUG] Enviando para login:', { email, password });
      success = await login({ email, password });
    } else {
      console.log('[DEBUG] Enviando para signup:', { email, password, name });
      success = await signup({ email, password, name });
    }
    
    if (success) {
      executeAuthCallback();
      hideAuthPopup();
      onClose();
      // Limpar formulário
      setEmail("");
      setPassword("");
      setName("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-memora-gray hover:text-memora-black transition-colors duration-200"
          aria-label="Fechar modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-heading font-bold text-memora-black mb-2">
            {isLogin ? "Entrar" : "Criar conta"}
          </h2>
          <p className="text-memora-gray">
            {isLogin 
              ? "Acesse suas músicas personalizadas" 
              : "Comece a criar suas músicas únicas"
            }
          </p>
        </div>

        {/* Google Auth Button */}
        <Button
          onClick={handleGoogleAuth}
          variant="outline"
          className="w-full mb-4 border-2 border-memora-gray-light hover:border-memora-primary hover:bg-memora-primary/5"
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

        {/* Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-memora-gray-light" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-memora-gray">ou</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="name" className="text-memora-black font-medium">
                Nome completo
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 h-12 border-2 border-memora-gray-light focus:border-memora-primary rounded-2xl"
                placeholder="Seu nome"
                required={!isLogin}
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="email" className="text-memora-black font-medium">
              E-mail
            </Label>
            <div className="relative mt-1">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-2 border-memora-gray-light focus:border-memora-primary rounded-2xl pl-10"
                placeholder="seu@email.com"
                required
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-memora-gray" />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-memora-black font-medium">
              Senha
            </Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-2 border-memora-gray-light focus:border-memora-primary rounded-2xl pr-10"
                placeholder="Sua senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-memora-gray hover:text-memora-black transition-colors duration-200"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-memora-primary hover:bg-memora-primary/90 text-white font-medium disabled:opacity-50"
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
          </Button>
        </form>

        {/* Toggle Login/Signup */}
        <div className="text-center mt-6">
          <p className="text-memora-gray">
            {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 text-memora-primary hover:text-memora-primary/80 font-medium transition-colors duration-200"
            >
              {isLogin ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;