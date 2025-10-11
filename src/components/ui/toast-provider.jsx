import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const toastVariants = {
  success: {
    icon: CheckCircle2,
    className: 'bg-green-50 border-green-200 text-green-800',
    iconClassName: 'text-green-600'
  },
  error: {
    icon: XCircle,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconClassName: 'text-red-600'
  },
  warning: {
    icon: AlertCircle,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconClassName: 'text-yellow-600'
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-800',
    iconClassName: 'text-blue-600'
  }
};

function Toast({ toast, onClose }) {
  const variant = toastVariants[toast.type] || toastVariants.info;
  const Icon = variant.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md w-full',
        variant.className
      )}
    >
      <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', variant.iconClassName)} />
      
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="font-semibold text-sm mb-1">{toast.title}</h4>
        )}
        {toast.description && (
          <p className="text-sm opacity-90">{toast.description}</p>
        )}
        {toast.action && (
          <div className="mt-2">
            {toast.action}
          </div>
        )}
      </div>
      
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = { id, ...toast };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration
    const duration = toast.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((options) => {
    if (typeof options === 'string') {
      return addToast({ description: options, type: 'info' });
    }
    return addToast(options);
  }, [addToast]);

  // Convenience methods
  toast.success = useCallback((options) => {
    if (typeof options === 'string') {
      return addToast({ description: options, type: 'success' });
    }
    return addToast({ ...options, type: 'success' });
  }, [addToast]);

  toast.error = useCallback((options) => {
    if (typeof options === 'string') {
      return addToast({ description: options, type: 'error' });
    }
    return addToast({ ...options, type: 'error' });
  }, [addToast]);

  toast.warning = useCallback((options) => {
    if (typeof options === 'string') {
      return addToast({ description: options, type: 'warning' });
    }
    return addToast({ ...options, type: 'warning' });
  }, [addToast]);

  toast.info = useCallback((options) => {
    if (typeof options === 'string') {
      return addToast({ description: options, type: 'info' });
    }
    return addToast({ ...options, type: 'info' });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              toast={toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
