import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  stack?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message, stack: error.stack };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application render error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '', stack: undefined });
    window.location.hash = '#/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <div className="max-w-lg w-full bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[#FDE8E8] text-[#E4332C] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-[#17231F]">Something went wrong</h2>
            <p className="text-sm text-[#718078] mt-2 break-words">
              {this.state.message || 'An unexpected error occurred while rendering this page.'}
            </p>
            {this.state.stack && (
              <pre className="mt-4 p-3 bg-[#F5F7F6] rounded-lg text-left text-[11px] text-[#718078] overflow-auto max-h-48 whitespace-pre-wrap">
                {this.state.stack}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2E7542] hover:bg-[#1E6337] rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
