import { useState, useEffect } from 'react';

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
  }, [setToastList]);

  return {
    toasts: toastList,
    toast,
  };
};