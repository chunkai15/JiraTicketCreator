import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';
import { Badge } from './badge';
import { fadeVariants } from '../../lib/animations';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          retryCount={this.state.retryCount}
          fallback={this.props.fallback}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({ 
  error, 
  errorInfo, 
  onRetry, 
  onReload, 
  retryCount = 0,
  fallback 
}) {
  // If a custom fallback is provided, use it
  if (fallback) {
    return fallback({ error, onRetry, onReload });
  }

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <motion.div
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      className="flex items-center justify-center min-h-[400px] p-4"
    >
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                An unexpected error occurred while rendering this component.
              </p>
            </div>
            {retryCount > 0 && (
              <Badge variant="secondary">
                Retry #{retryCount}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isDevelopment && error && (
            <Alert variant="destructive">
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Error: {error.message}</p>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                  {errorInfo && errorInfo.componentStack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">
                        Component Stack
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onRetry} variant="default" className="flex-1">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </Button>
            <Button onClick={onReload} variant="outline" className="flex-1">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reload Page
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            If this problem persists, please contact support or check the browser console for more details.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary(Component, fallback) {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for handling async errors
export function useErrorHandler() {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}

export default ErrorBoundary;
