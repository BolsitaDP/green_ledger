import {
  useCallback,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { ToastContext, type ToastInput, type ToastTone } from './toastContext'

type ToastItem = ToastInput & {
  id: string
  tone: ToastTone
}

let toastCounter = 0

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((toastId: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId))
  }, [])

  const showToast = useCallback((input: ToastInput) => {
    const toastId = `toast-${Date.now()}-${toastCounter++}`
    const tone = input.tone ?? 'info'

    setToasts((current) => [
      ...current.slice(-2),
      {
        id: toastId,
        title: input.title,
        description: input.description,
        tone,
      },
    ])

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== toastId))
    }, 4200)
  }, [])

  const value = useMemo(
    () => ({
      showToast,
      dismissToast,
    }),
    [dismissToast, showToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <article key={toast.id} className={`toast-card toast-${toast.tone}`}>
            <div className="toast-header">
              <strong>{toast.title}</strong>
              <button type="button" className="toast-close" onClick={() => dismissToast(toast.id)} aria-label="Cerrar">
                x
              </button>
            </div>
            {toast.description ? <p>{toast.description}</p> : null}
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
