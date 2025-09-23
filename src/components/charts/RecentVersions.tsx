'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, Tag, Package } from 'lucide-react'
import Link from 'next/link'

interface RecentVersion {
  id: string
  version_number: string
  tag: string
  release_date: string
  module: { name: string }
}

interface RecentVersionsProps {
  versions: RecentVersion[]
}

export function RecentVersions({ versions }: RecentVersionsProps) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2" />
        Versões Recentes
      </h3>
      
      {versions.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Nenhuma versão encontrada
        </p>
      ) : (
        <div className="space-y-3">
          {versions.map((version) => (
            <Link
              key={version.id}
              href={`/dashboard/versions/${version.id}`}
              className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {version.version_number}
                    </span>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <Tag className="w-3 h-3 mr-1" />
                      <span className="text-sm">{version.tag}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {version.module.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(version.release_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}