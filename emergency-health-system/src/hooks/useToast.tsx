import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '../utils/helpers'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

let toastApi: Pick<ToastContextType, 'success' | 'error' | 'warning' | 'info'> | undefined

export const toast = {
  success: (title: string, message?: string) => toastApi?.success(title, message),
  error: (title: string, message?: string) => toastApi?.error(title, message),
  warning: (title: string, message?: string) => toastApi?.warning(title, message),
  info: (title: string, message?: string) => toastApi?.info(title, message),
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: Toast['type'], title: string, message?: string, duration = 5000) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, type, title, message, duration }])
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  toastApi = {
    success: (title, message) => addToast('success', title, message),
    error: (title, message) => addToast('error', title, message),
    warning: (title, message) => addToast('warning', title, message),
    info: (title, message) => addToast('info', title, message),
  }

  return (
    <ToastContext.Provider value={{
      toasts,
      success: (title, message) => addToast('success', title, message),
      error: (title, message) => addToast('error', title, message),
      warning: (title, message) => addToast('warning', title, message),
      info: (title, message) => addToast('info', title, message),
      dismiss,
    }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emergency-green" />,
    error: <AlertCircle className="w-5 h-5 text-emergency-red" />,
    warning: <AlertTriangle className="w-5 h-5 text-emergency-amber" />,
    info: <Info className="w-5 h-5 text-emergency-blue" />,
  }

  const bgColors = {
    success: 'bg-emergency-green-light border-emergency-green',
    error: 'bg-emergency-red-light border-emergency-red',
    warning: 'bg-emergency-amber-light border-emergency-amber',
    info: 'bg-emergency-blue-light border-emergency-blue',
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-in',
            bgColors[toast.type]
          )}
          role="alert"
        >
          <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">{toast.title}</p>
            {toast.message && (
              <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>
            )}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
