'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'

interface LoadingStateProps {
  isLoading: boolean
  error?: string | null
  success?: boolean
  loadingText?: string
  successText?: string
  errorText?: string
  duration?: number
  onComplete?: () => void
  className?: string
}

export function LoadingState({
  isLoading,
  error,
  success,
  loadingText = 'Carregando...',
  successText = 'Concluído!',
  errorText,
  duration = 3000,
  onComplete,
  className = ''
}: LoadingStateProps) {
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (success && !isLoading && !error) {
      setShowSuccess(true)
      const timer = setTimeout(() => {
        setShowSuccess(false)
        onComplete?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [success, isLoading, error, duration, onComplete])

  if (!isLoading && !error && !showSuccess) {
    return null
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isLoading && (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {loadingText}
          </span>
        </>
      )}
      
      {error && (
        <>
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">
            {errorText || error}
          </span>
        </>
      )}
      
      {showSuccess && (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400">
            {successText}
          </span>
        </>
      )}
    </div>
  )
}

interface ProgressBarProps {
  progress: number
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
  className?: string
}

export function ProgressBar({
  progress,
  variant = 'default',
  size = 'md',
  showPercentage = false,
  className = ''
}: ProgressBarProps) {
  const colors = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  }

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <div className={`w-full ${className}`}>
      <div className={`bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${colors[variant]} ${heights[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
          <span>{clampedProgress.toFixed(0)}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  )
}

interface BulkOperationProgressProps {
  total: number
  completed: number
  failed: number
  currentOperation?: string
  operationType: string
  onCancel?: () => void
  onComplete?: () => void
}

export function BulkOperationProgress({
  total,
  completed,
  failed,
  currentOperation,
  operationType,
  onCancel,
  onComplete
}: BulkOperationProgressProps) {
  const progress = ((completed + failed) / total) * 100
  const isComplete = completed + failed >= total

  useEffect(() => {
    if (isComplete && onComplete) {
      const timer = setTimeout(onComplete, 1500)
      return () => clearTimeout(timer)
    }
  }, [isComplete, onComplete])

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg max-w-md mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {operationType}
        </h3>
        {onCancel && !isComplete && (
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Cancelar
          </button>
        )}
      </div>

      <ProgressBar
        progress={progress}
        variant={failed > 0 ? 'warning' : isComplete ? 'success' : 'default'}
        showPercentage
      />

      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Progresso:</span>
          <span className="text-gray-900 dark:text-white">
            {completed + failed} de {total}
          </span>
        </div>
        
        {completed > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600 dark:text-green-400">Concluídos:</span>
            <span className="text-green-600 dark:text-green-400">{completed}</span>
          </div>
        )}
        
        {failed > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-red-600 dark:text-red-400">Falhas:</span>
            <span className="text-red-600 dark:text-red-400">{failed}</span>
          </div>
        )}
      </div>

      {currentOperation && !isComplete && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentOperation}
            </span>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {failed === 0 ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  Operação concluída com sucesso!
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  Operação concluída com {failed} falha(s)
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}