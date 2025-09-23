'use client'

import { Suspense, lazy } from 'react'
import { TableSkeleton } from '@/src/components/ui/Skeletons'
import { LazyErrorBoundary } from '@/src/components/ui/LazyErrorBoundary'

// Lazy load dos relatórios
const ReportsContent = lazy(() => 
  import('@/src/components/reports/ReportsContent').then(module => ({
    default: module.ReportsContent
  }))
)

export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Relatórios
      </h1>
      
      <LazyErrorBoundary>
        <Suspense fallback={<TableSkeleton />}>
          <ReportsContent />
        </Suspense>
      </LazyErrorBoundary>
    </div>
  )
}