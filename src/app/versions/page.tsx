'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import Link from 'next/link'
import { Plus, Eye, Edit } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function VersionsPage() {
  const [versions, setVersions] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const loadVersions = async () => {
      try {
        const { data, error } = await supabase
          .from('versions')
          .select(`
            *,
            modules (name)
          `)
          .order('created_at', { ascending: false })

        if (error) {
          setError(error.message)
        } else {
          setVersions(data || [])
        }
      } catch (err) {
        setError('Erro ao carregar versões')
      } finally {
        setIsLoading(false)
      }
    }

    loadVersions()
  }, [supabase])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Versões
        </h1>
        <Link
          href="/versions/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Versão
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4">
          Erro ao carregar versões: {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Módulo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Versão
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tag
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Data de Liberação
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {versions?.map((version: any) => (
              <tr key={version.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {version.modules?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {version.version_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {version.tag}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {version.release_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/versions/${version.id}`}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                  >
                    <Eye className="w-4 h-4 inline" />
                  </Link>
                  <Link
                    href={`/versions/${version.id}/edit`}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                  >
                    <Edit className="w-4 h-4 inline" />
                  </Link>
                </td>
              </tr>
            ))}
            {(!versions || versions.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Nenhuma versão cadastrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}