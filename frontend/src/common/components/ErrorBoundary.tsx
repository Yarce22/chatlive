import { Component, ErrorInfo, ReactNode } from 'react';
import { Message, Button, Icon } from 'semantic-ui-react';
import { ErrorType, handleError } from '../../shared/services/errorService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    handleError(error, ErrorType.Unknown, { componentStack: errorInfo.componentStack });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
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
