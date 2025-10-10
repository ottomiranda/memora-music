import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError } from '@/types/app';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: AppError | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    const appError: AppError = {
      code: 'REACT_ERROR',
      message: error.message,
      stack: error.stack
    };

    return {
      hasError: true,
      error: appError
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError: AppError = {
      code: 'REACT_ERROR',
      message: error.message,
      stack: error.stack,
      details: {
        componentStack: errorInfo.componentStack
      }
    };

    logger.error({
      msg: 'React error boundary caught an error',
      error: appError
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="max-w-md p-8 text-center">
            <h1 className="mb-4 text-2xl font-bold text-red-600">
              Oops! Algo deu errado
            </h1>
            <p className="mb-6 text-gray-600">
              Ocorreu um erro inesperado. Por favor, tente recarregar a página.
            </p>
            {this.state.error && (
              <pre className="mb-6 max-h-40 overflow-auto rounded bg-gray-100 p-4 text-left text-sm text-gray-800">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-primary px-6 py-2 text-white hover:bg-primary/90"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
