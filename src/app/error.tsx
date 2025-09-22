'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 text-red-600 mx-auto" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-4">
          Algo deu errado!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">
          Ocorreu um erro ao processar sua solicitação.
        </p>
        
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}