'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface LazyErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface LazyErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class LazyErrorBoundary extends React.Component<
  LazyErrorBoundaryProps,
  LazyErrorBoundaryState
> {
  constructor(props: LazyErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                Erro ao carregar componente
              </h3>
              <p className="text-red-600 dark:text-red-400 mt-1">
                Não foi possível carregar este componente. Tente recarregar a página.
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recarregar página</span>
          </button>
        </div>
      )
    }

    return this.props.children
  }
}