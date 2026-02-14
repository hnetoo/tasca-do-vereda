import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '../services/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Uncaught error caught by boundary', { error: error.toString(), componentStack: errorInfo.componentStack }, 'ErrorBoundary');
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-slate-900/50 p-8 rounded-3xl border border-red-500/20 max-w-md w-full backdrop-blur-xl shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 text-red-500">
              <AlertTriangle size={32} />
            </div>
            
            <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
              Algo correu mal
            </h1>
            
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              Ocorreu um erro inesperado na aplicação. Tente recarregar a página.
            </p>

            {this.state.error && (
              <div className="bg-black/30 p-4 rounded-xl text-left mb-6 overflow-auto max-h-40 border border-white/5">
                <p className="text-xs font-mono text-red-300 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw size={18} />
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
