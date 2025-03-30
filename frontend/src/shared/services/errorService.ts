import React from 'react';

export enum ErrorType {
  Network = 'NETWORK_ERROR',
  Auth = 'AUTHENTICATION_ERROR',
  Socket = 'SOCKET_ERROR',
  Api = 'API_ERROR',
  Validation = 'VALIDATION_ERROR',
  Unknown = 'UNKNOWN_ERROR'
}

export interface AppError {
  type: ErrorType;
  message: string;
  timestamp: Date;
  code?: string;
  data?: any;
  originalError?: Error;
}

class ErrorService {
  private errorListeners: Array<(error: AppError) => void> = [];
  private errors: AppError[] = [];
  
  captureError(type: ErrorType, message: string, originalError?: Error, data?: any, code?: string): AppError {
    const appError: AppError = {
      type,
      message,
      timestamp: new Date(),
      code,
      data,
      originalError
    };
    
    this.errors.push(appError);
    
    this.notifyListeners(appError);
    
    if (import.meta.env.MODE !== 'production') {
      console.error(`[${type}]`, message, originalError || '');
    }
    
    return appError;
  }
  
  addListener(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }
  
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error en listener de errores:', listenerError);
      }
    });
  }

  getRecentErrors(limit: number = 10): AppError[] {
    return [...this.errors].slice(-limit);
  }
  
  clearErrors(): void {
    this.errors = [];
  }
}

export const errorService = new ErrorService();

export function handleError(error, errorType: ErrorType = ErrorType.Unknown, additionalData?: any): AppError {
  let message = 'Se produjo un error desconocido';
  let errorCode;
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    message = error.message || 'Error con datos desconocidos';
    errorCode = error.code || error.status;
  }
  
  return errorService.captureError(errorType, message, error instanceof Error ? error : undefined, additionalData, errorCode);
}

export function withErrorHandling<P>(Component: React.ComponentType<P>): React.FC<P> {
  return (props: P) => {
    try {
      return React.createElement(Component, props);
    } catch (error) {
      handleError(error, ErrorType.Unknown);
      return React.createElement('div', { className: 'error-boundary' }, 'Se produjo un error al renderizar este componente.');
    }
  };
}
