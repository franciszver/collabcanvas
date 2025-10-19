import React, { useEffect, useState } from 'react'

export interface ToastProps {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
}

export default function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onClose?.(), 300) // Wait for fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!visible) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          background: '#10B981',
          borderColor: '#059669',
          icon: '✓'
        }
      case 'error':
        return {
          background: '#EF4444',
          borderColor: '#DC2626',
          icon: '✕'
        }
      case 'warning':
        return {
          background: '#F59E0B',
          borderColor: '#D97706',
          icon: '⚠'
        }
      case 'info':
        return {
          background: '#3B82F6',
          borderColor: '#2563EB',
          icon: 'ℹ'
        }
      default:
        return {
          background: '#6B7280',
          borderColor: '#4B5563',
          icon: 'ℹ'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: styles.background,
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        border: `1px solid ${styles.borderColor}`,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: 1000,
        maxWidth: '400px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <span style={{ fontSize: '16px' }}>{styles.icon}</span>
      <span>{message}</span>
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(() => onClose?.(), 300)
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '0',
          marginLeft: '8px',
          opacity: 0.7
        }}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  )
}

// Toast context for managing multiple toasts
export interface ToastContextValue {
  showToast: (message: string, type: ToastProps['type'], duration?: number) => void
}

export const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([])

  const showToast = (message: string, type: ToastProps['type'], duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastProps & { id: string } = {
      id,
      message,
      type,
      duration,
      onClose: () => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
      }
    }
    
    setToasts(prev => [...prev, newToast])
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={toast.onClose}
        />
      ))}
    </ToastContext.Provider>
  )
}
