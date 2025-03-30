/**
 * Componente de lu00edmite de error (Error Boundary) para capturar errores en la UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Message, Button, Icon } from 'semantic-ui-react';
import { ErrorType, handleError } from '../../shared/services/errorService';

interface Props {
  /** Componentes hijo */
  children: ReactNode;
  /** Componente de fallback personalizado (opcional) */
  fallback?: ReactNode;
  /** Funciu00f3n a ejecutar cuando ocurre un error (opcional) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Componente que captura errores en sus componentes hijos y muestra
 * una interfaz de respaldo en lugar de colapsar toda la aplicaciu00f3n.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Actualizar el estado para que el siguiente renderizado muestre la UI de respaldo
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Registrar el error en nuestro servicio de errores
    handleError(error, ErrorType.Unknown, { componentStack: errorInfo.componentStack });
    
    // Ejecutar callback personalizado si existe
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Actualizar el estado con la informaciu00f3n del error
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Si se proporcionu00f3 un componente de fallback personalizado, mostrarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Componente de fallback predeterminado
      return (
        <Message negative className="error-boundary-message">
          <Message.Header>
            <Icon name="warning sign" /> Se ha producido un error
          </Message.Header>
          <p>Lo sentimos, ha ocurrido un problema al cargar este componente.</p>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <div className="error-details">
              <p><strong>Error:</strong> {this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <pre style={{ whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: '200px' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}
          <Button primary onClick={this.handleReset}>Reintentar</Button>
        </Message>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
