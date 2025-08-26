import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  duration?: number;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'error',
  duration = 5000,
  onClose,
  className
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Animação de entrada
    setTimeout(() => setIsAnimating(true), 10);

    // Auto-close após duração especificada
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // Tempo da animação de saída
  };

  if (!isVisible) return null;

  const getToastStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-accent-coral/10 border-accent-coral/20 text-neutral-black';
      case 'success':
        return 'bg-accent-teal/10 border-accent-teal/20 text-neutral-black';
      case 'info':
        return 'bg-neutral-gray/10 border-neutral-gray/20 text-neutral-black';
      default:
        return 'bg-accent-coral/10 border-accent-coral/20 text-neutral-black';
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-md w-full',
        'transform transition-all duration-300 ease-in-out',
        isAnimating
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0',
        className
      )}
    >
      <div
        className={cn(
          'rounded-lg border p-4 shadow-lg backdrop-blur-sm',
          'flex items-start gap-3',
          getToastStyles()
        )}
      >
        <div className="flex-1">
          <p className="text-sm font-medium leading-relaxed">
            {message}
          </p>
        </div>
        
        <button
          onClick={handleClose}
          className={cn(
            'flex-shrink-0 rounded-full p-1',
            'hover:bg-neutral-black/10 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-accent-coral/50'
          )}
          aria-label="Fechar notificação"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Hook para gerenciar toasts
interface ToastState {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
  duration?: number;
}

let toastId = 0;
const toastListeners: Array<(toasts: ToastState[]) => void> = [];
let toasts: ToastState[] = [];

const notifyListeners = () => {
  toastListeners.forEach(listener => listener([...toasts]));
};

export const toast = {
  error: (message: string, duration?: number) => {
    const id = `toast-${++toastId}`;
    toasts.push({ id, message, type: 'error', duration });
    notifyListeners();
    return id;
  },
  
  success: (message: string, duration?: number) => {
    const id = `toast-${++toastId}`;
    toasts.push({ id, message, type: 'success', duration });
    notifyListeners();
    return id;
  },
  
  info: (message: string, duration?: number) => {
    const id = `toast-${++toastId}`;
    toasts.push({ id, message, type: 'info', duration });
    notifyListeners();
    return id;
  },
  
  dismiss: (id: string) => {
    toasts = toasts.filter(toast => toast.id !== id);
    notifyListeners();
  },
  
  dismissAll: () => {
    toasts = [];
    notifyListeners();
  }
};

export const useToast = () => {
  const [toastList, setToastList] = useState<ToastState[]>([]);

  useEffect(() => {
    toastListeners.push(setToastList);
    return () => {
      const index = toastListeners.indexOf(setToastList);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  return {
    toasts: toastList,
    toast,
  };
};

// Componente ToastContainer para renderizar todos os toasts
export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <>
      {toasts.map((toastItem, index) => (
        <Toast
          key={toastItem.id}
          message={toastItem.message}
          type={toastItem.type}
          duration={toastItem.duration}
          onClose={() => toast.dismiss(toastItem.id)}
          className={`bottom-${4 + index * 16}`} // Empilhar toasts na parte inferior
        />
      ))}
    </>
  );
};