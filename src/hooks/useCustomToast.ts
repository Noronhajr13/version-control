'use client'

import { toast } from 'sonner'

interface ToastOptions {
  duration?: number
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
}

export const useCustomToast = () => {
  const success = (message: string, options?: ToastOptions) => {
    toast.success(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right'
    })
  }

  const error = (message: string, options?: ToastOptions) => {
    toast.error(message, {
      duration: options?.duration || 6000,
      position: options?.position || 'top-right'
    })
  }

  const warning = (message: string, options?: ToastOptions) => {
    toast.warning(message, {
      duration: options?.duration || 5000,
      position: options?.position || 'top-right'
    })
  }

  const info = (message: string, options?: ToastOptions) => {
    toast.info(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right'
    })
  }

  // Specialized toasts for actions
  const bulkDelete = (count: number, itemType: string) => {
    success(`✅ ${count} ${itemType} deletados com sucesso`, {
      duration: 3000
    })
  }

  const bulkSelect = (count: number, itemType: string) => {
    info(`📝 ${count} ${itemType} selecionados`, {
      duration: 2000
    })
  }

  const copied = (text?: string) => {
    success(`📋 ${text ? `${text} copiado!` : 'Copiado para área de transferência'}`, {
      duration: 2000
    })
  }

  const loading = (message: string) => {
    return toast.loading(`⏳ ${message}`, {
      duration: Infinity,
      position: 'top-right'
    })
  }

  const dismiss = (toastId?: string | number) => {
    if (toastId) {
      toast.dismiss(toastId)
    } else {
      toast.dismiss()
    }
  }

  const promise = <T,>(
    promise: Promise<T>,
    {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return toast.promise(promise, {
      loading: `⏳ ${loadingMessage}`,
      success: typeof successMessage === 'string' ? `✅ ${successMessage}` : successMessage,
      error: typeof errorMessage === 'string' ? `❌ ${errorMessage}` : errorMessage,
      position: 'top-right'
    })
  }

  // Keyboard shortcut feedback
  const shortcutUsed = (shortcut: string, action: string) => {
    info(`⌨️ ${shortcut}: ${action}`, {
      duration: 1500
    })
  }

  // Bulk action feedbacks
  const bulkActionStarted = (action: string, count: number, itemType: string) => {
    return loading(`${action} ${count} ${itemType}...`)
  }

  const bulkActionCompleted = (action: string, count: number, itemType: string) => {
    success(`✅ ${action} de ${count} ${itemType} concluída`)
  }

  const bulkActionFailed = (action: string, count: number, itemType: string, errorMsg?: string) => {
    const fullErrorMsg = errorMsg ? `: ${errorMsg}` : ''
    error(`❌ Falha ao ${action.toLowerCase()} ${count} ${itemType}${fullErrorMsg}`)
  }

  return {
    success,
    error,
    warning,
    info,
    bulkDelete,
    bulkSelect,
    copied,
    loading,
    dismiss,
    promise,
    shortcutUsed,
    bulkActionStarted,
    bulkActionCompleted,
    bulkActionFailed
  }
}