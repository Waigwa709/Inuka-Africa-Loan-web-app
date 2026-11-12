import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (title: string, description?: string, type?: ToastType) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (title: string, description?: string, type: ToastType = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setToasts((prev) => [...prev, { id, title, description, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const success = useCallback((title: string, description?: string) => addToast(title, description, 'success'), [addToast]);
  const error = useCallback((title: string, description?: string) => addToast(title, description, 'error'), [addToast]);
  const info = useCallback((title: string, description?: string) => addToast(title, description, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      {/* Toast container floating bottom-right */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
        role="region"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg transition-all duration-200 animate-in slide-in-from-bottom-2 ${
              item.type === 'success'
                ? 'bg-white border-[#E7F3EA] text-[#17231F]'
                : item.type === 'error'
                ? 'bg-white border-[#FDE8E8] text-[#17231F]'
                : 'bg-white border-slate-200 text-[#17231F]'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {item.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#2E7542]" />}
              {item.type === 'error' && <AlertCircle className="w-5 h-5 text-[#E4332C]" />}
              {item.type === 'info' && <Info className="w-5 h-5 text-[#3578C8]" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight text-[#17231F]">{item.title}</p>
              {item.description && (
                <p className="mt-1 text-xs text-[#718078] leading-relaxed">{item.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
