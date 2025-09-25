'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Edit, ExternalLink, Calendar, Package, Users, FileCode, FileText, GitBranch } from 'lucide-react'

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
          <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg mr-3">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                Informações da Versão
              </h2>
            </div>
            
            <div className="p-6">
            
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

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Versão PowerBuilder</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {(version as any).powerbuilder_version || <span className="text-gray-400">Não especificada</span>}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Link do EXE (SharePoint)</dt>
                <dd className="mt-1 text-sm">
                  {(version as any).exe_path ? (
                    <a 
                      href={(version as any).exe_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center break-all"
                    >
                      <ExternalLink className="w-4 h-4 mr-1 flex-shrink-0" />
                      {(version as any).exe_path}
                    </a>
                  ) : (
                    <span className="text-gray-400">Não especificado</span>
                  )}
                </dd>
              </div>
            </dl>
            </div>
          </div>

          {/* Motivo da Versão */}
          {(version as any).description && (
            <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg mr-3">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-lg">Motivo da Versão</div>
                    <div className="text-sm font-normal text-gray-600 dark:text-gray-400">
                      Problemas solucionados e melhorias implementadas
                    </div>
                  </div>
                </h2>
              </div>
              
              <div className="p-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-5 rounded-lg border border-blue-200 dark:border-blue-800/30">
                  <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200">
                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                      {(version as any).description}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    Documentação técnica da versão
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>📝</span>
                    <span>Release Notes</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scripts */}
          {((version as any).scripts || (version as any).script_executed) && (
            <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg mr-3">
                    <FileCode className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-lg">Scripts</div>
                    <div className="text-sm font-normal text-gray-600 dark:text-gray-400">
                      Arquivos executados nesta versão
                    </div>
                  </div>
                </h2>
              </div>
              
              <div className="p-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
                    {(version as any).scripts || (version as any).script_executed}
                  </pre>
                </div>
                
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                    Scripts de migração e patches
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>💡</span>
                    <span>Execução sequencial</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cards Jira */}
          <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-lg mr-3">
                  <GitBranch className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-lg">Cards Jira</div>
                  <div className="text-sm font-normal text-gray-600 dark:text-gray-400">
                    {version.cards?.length || 0} card(s) associado(s)
                  </div>
                </div>
              </h2>
            </div>
            
            <div className="p-6">
            
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
        </div>

        {/* Sidebar com Clientes */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg mr-3">
                  <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="text-lg">Clientes</div>
                  <div className="text-sm font-normal text-gray-600 dark:text-gray-400">
                    {version.version_clients?.length || 0} cliente(s) usando
                  </div>
                </div>
              </h2>
            </div>
            
            <div className="p-6">
            
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
          </div>

          {/* Metadados */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
              Metadados
            </h3>
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
