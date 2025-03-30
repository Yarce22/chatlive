/**
 * Servicio para el manejo centralizado de errores en la aplicación
 */
import React from 'react';

// Tipos de errores
export enum ErrorType {
  Network = 'NETWORK_ERROR',
  Auth = 'AUTHENTICATION_ERROR',
  Socket = 'SOCKET_ERROR',
  Api = 'API_ERROR',
  Validation = 'VALIDATION_ERROR',
  Unknown = 'UNKNOWN_ERROR'
}

// Interfaz para errores estructurados
export interface AppError {
  type: ErrorType;
  message: string;
  timestamp: Date;
  code?: string;
  data?: any;
  originalError?: Error;
}

/**
 * Clase para el manejo centralizado de errores
 */
class ErrorService {
  private errorListeners: Array<(error: AppError) => void> = [];
  private errors: AppError[] = [];
  
  /**
   * Captura y procesa un error
   * @param type - Tipo de error
   * @param message - Mensaje de error
   * @param originalError - Error original (opcional)
   * @param data - Datos adicionales (opcional)
   * @param code - Código de error (opcional)
   * @returns El error procesado
   */
  captureError(type: ErrorType, message: string, originalError?: Error, data?: any, code?: string): AppError {
    const appError: AppError = {
      type,
      message,
      timestamp: new Date(),
      code,
      data,
      originalError
    };
    
    // Guardar el error en el historial
    this.errors.push(appError);
    
    // Notificar a los listeners
    this.notifyListeners(appError);
    
    // Registrar en la consola (en desarrollo)
    if (import.meta.env.MODE !== 'production') {
      console.error(`[${type}]`, message, originalError || '');
    }
    
    return appError;
  }
  
  /**
   * Registra un listener para recibir notificaciones de errores
   * @param listener - Función que manejará los errores
   * @returns Función para eliminar el listener
   */
  addListener(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Notifica a todos los listeners sobre un nuevo error
   * @param error - El error a notificar
   */
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error en listener de errores:', listenerError);
      }
    });
  }
  
  /**
   * Obtiene los últimos N errores registrados
   * @param limit - Número de errores a obtener
   * @returns Array con los últimos errores
   */
  getRecentErrors(limit: number = 10): AppError[] {
    return [...this.errors].slice(-limit);
  }
  
  /**
   * Limpia el historial de errores
   */
  clearErrors(): void {
    this.errors = [];
  }
}

// Exportar una única instancia (singleton)
export const errorService = new ErrorService();

/**
 * Maneja errores de forma centralizada
 * @param error - Error capturado
 * @param errorType - Tipo de error (opcional, por defecto Unknown)
 * @param additionalData - Datos adicionales (opcional)
 * @returns El error procesado
 */
export function handleError(error: any, errorType: ErrorType = ErrorType.Unknown, additionalData?: any): AppError {
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

/**
 * High-order component para capturar errores de componentes React
 * @param Component - Componente a envolver
 * @returns Componente con manejo de errores
 */
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
