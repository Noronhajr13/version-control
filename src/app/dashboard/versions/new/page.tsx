'use client'

import { Suspense, lazy } from 'react'
import Link from 'next/link'
import { FormSkeleton } from '@/src/components/ui/Skeletons'
import { LazyErrorBoundary } from '@/src/components/ui/LazyErrorBoundary'

// Lazy load do formulário pesado
const NewVersionForm = lazy(() => 
  import('@/src/components/forms/NewVersionForm').then(module => ({
    default: module.NewVersionForm
  }))
)

export default function NewVersionPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Nova Versão
        </h1>
        <Link
          href="/dashboard/versions"
          className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
        <LazyErrorBoundary>
          <Suspense fallback={<FormSkeleton />}>
            <NewVersionForm />
          </Suspense>
        </LazyErrorBoundary>
      </div>
    </div>
  )
}