'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Edit, ExternalLink, Calendar, Package, Users, FileCode, GitBranch } from 'lucide-react'

import type { Database } from '@/src/lib/types/database'
type VersionWithRelations = Database['public']['Tables']['versions']['Row'] & {
  modules?: { name: string }
  cards?: Database['public']['Tables']['cards']['Row'][]
  version_clients?: (Database['public']['Tables']['version_clients']['Row'] & { clients?: { name: string; uf: string } })[]
}

export default function VersionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [version, setVersion] = useState<VersionWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [versionId, setVersionId] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Inicializar parâmetros
  useEffect(() => {
    const initializeParams = async () => {
      const { id } = await params
      setVersionId(id)
    }
    initializeParams()
  }, [params])

  // Carregar dados da versão
  useEffect(() => {
    if (!versionId) return

    const loadVersion = async () => {
      try {
        const { data, error } = await supabase
          .from('versions')
          .select(`
            *,
            modules (name),
            cards (*),
            version_clients (
              *,
              clients (name, uf)
            )
          `)
          .eq('id', versionId)
          .single<VersionWithRelations>()

        if (error || !data) {
          setError('Versão não encontrada')
          router.push('/dashboard/versions')
          return
        }

        setVersion(data)
      } catch (err) {
        setError('Erro ao carregar versão')
        router.push('/dashboard/versions')
      } finally {
        setIsLoading(false)
      }
    }

    loadVersion()
  }, [versionId, supabase, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Carregando...</div>
      </div>
    )
  }

  if (error || !version) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error || 'Versão não encontrada'}</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/versions"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {version.modules?.name} - {version.version_number}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Tag: {version.tag}
            </p>
          </div>
        </div>
        
        <Link
          href={`/dashboard/versions/${versionId}/edit`}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detalhes da Versão */}
          <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              Informações da Versão
            </h2>
            
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Módulo</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{version.modules?.name}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Número da Versão</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{version.version_number}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tag</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{version.tag}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Liberação</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {version.release_date ? (
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(version.release_date).toLocaleDateString('pt-BR')}
                    </span>
                  ) : (
                    <span className="text-gray-400">Não definida</span>
                  )}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Pasta Themes</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {version.themes_folder || <span className="text-gray-400">Não especificada</span>}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Card Jira Principal</dt>
                <dd className="mt-1 text-sm">
                  {version.jira_card ? (
                    <a 
                      href={version.jira_card}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Ver no Jira
                    </a>
                  ) : (
                    <span className="text-gray-400">Não especificado</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Script Executado */}
          {version.script_executed && (
            <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileCode className="w-5 h-5 mr-2 text-purple-600" />
                Script Executado
              </h2>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
                <code className="text-sm text-gray-800 dark:text-gray-200">
                  {version.script_executed}
                </code>
              </pre>
            </div>
          )}

          {/* Cards Jira */}
          <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <GitBranch className="w-5 h-5 mr-2 text-green-600" />
              Cards Jira ({version.cards?.length || 0})
            </h2>
            
            {version.cards && version.cards.length > 0 ? (
              <div className="space-y-2">
                {version.cards.map((card: Database['public']['Tables']['cards']['Row']) => (
                  <div key={card.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <a 
                      href={card.jira_number.startsWith('http') ? card.jira_number : `#`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      {card.jira_number}
                    </a>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Atualizado: {new Date(card.last_update).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Nenhum card associado</p>
            )}
          </div>
        </div>

        {/* Sidebar com Clientes */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-indigo-600" />
              Clientes ({version.version_clients?.length || 0})
            </h2>
            
            {version.version_clients && version.version_clients.length > 0 ? (
              <div className="space-y-2">
                {version.version_clients.map((vc: Database['public']['Tables']['version_clients']['Row'] & { clients?: { name: string; uf: string } }) => (
                  <div key={vc.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {vc.clients?.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {vc.clients?.uf}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum cliente usando esta versão</p>
            )}
          </div>

          {/* Metadados */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Metadados</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">ID da Versão</dt>
                <dd className="text-xs font-mono text-gray-600 dark:text-gray-300">{version.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Criado em</dt>
                <dd className="text-xs text-gray-600 dark:text-gray-300">
                  {new Date(version.created_at).toLocaleString('pt-BR')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
