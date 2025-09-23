'use client'

import Link from 'next/link'
import { Plus, Edit } from '@/src/components/ui/icons'
import { TableSkeleton } from '@/src/components/ui/Skeletons'
import { LazyErrorBoundary } from '@/src/components/ui/LazyErrorBoundary'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamic imports para componentes pesados
const ModulesTable = dynamic(() => import('./ModulesTable'), {
  loading: () => <TableSkeleton />,
  ssr: false
})

export default function ModulesPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Módulos
        </h1>
        <Link
          href="/dashboard/modules/new"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Módulo
        </Link>
      </div>

      <LazyErrorBoundary>
        <Suspense fallback={<TableSkeleton />}>
          <ModulesTable />
        </Suspense>
      </LazyErrorBoundary>
    </div>
  )
}