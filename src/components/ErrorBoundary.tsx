import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      let isPermissionError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Firestore Error: ${parsed.error} during ${parsed.operationType} on ${parsed.path}`;
            isPermissionError = true;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-rose-500" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-4">Oops! Something went wrong</h2>
            <div className="bg-black/50 rounded-xl p-4 mb-6 border border-zinc-800">
              <p className="text-sm text-zinc-400 font-mono break-words">
                {errorMessage}
              </p>
            </div>
            {isPermissionError && (
              <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                This usually happens when your session expires or you don't have the required permissions. Try logging in again.
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all active:scale-95"
            >
              <RefreshCw size={18} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
