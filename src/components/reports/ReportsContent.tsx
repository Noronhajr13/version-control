'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import type { Database } from '@/src/lib/types/database'
import { FileText, Users, Package } from 'lucide-react'

export function ReportsContent() {
  type Module = Database['public']['Tables']['modules']['Row']
  type Version = Database['public']['Tables']['versions']['Row'] & { modules?: { name: string } }
  type ModuleVersion = Database['public']['Tables']['versions']['Row']
  type VersionClient = Database['public']['Tables']['version_clients']['Row'] & { clients?: { name: string; uf: string } }

  const [modules, setModules] = useState<Module[]>([])
  const [versions, setVersions] = useState<Version[]>([])
  const [selectedModule, setSelectedModule] = useState('')
  const [selectedVersion, setSelectedVersion] = useState('')
  const [moduleVersions, setModuleVersions] = useState<ModuleVersion[]>([])
  const [versionClients, setVersionClients] = useState<VersionClient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedModule) {
      loadModuleVersions()
    }
  }, [selectedModule])

  useEffect(() => {
    if (selectedVersion) {
      loadVersionClients()
    }
  }, [selectedVersion])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      const [modulesRes, versionsRes] = await Promise.all([
        supabase.from('modules').select('*').order('name'),
        supabase.from('versions').select('*, modules(name)').order('created_at', { ascending: false })
      ])

      if (modulesRes.data) setModules(modulesRes.data)
      if (versionsRes.data) setVersions(versionsRes.data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadModuleVersions = async () => {
    const { data } = await supabase
      .from('versions')
      .select('*')
      .eq('module_id', selectedModule)
      .order('created_at', { ascending: false })

    if (data) setModuleVersions(data)
  }

  const loadVersionClients = async () => {
    const { data } = await supabase
      .from('version_clients')
      .select(`
        *,
        clients!inner(name, uf)
      `)
      .eq('version_id', selectedVersion)

    if (data) setVersionClients(data)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total de Módulos
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {modules.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total de Versões
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {versions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Clientes com Versões
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {versionClients.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Filtrar Relatórios
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="module" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Módulo
            </label>
            <select
              id="module"
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value)
                setSelectedVersion('')
                setVersionClients([])
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos os módulos</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="version" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Versão
            </label>
            <select
              id="version"
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              disabled={!selectedModule}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            >
              <option value="">Todas as versões</option>
              {moduleVersions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.version_number} - {version.tag}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Clientes por Versão */}
      {selectedVersion && versionClients.length > 0 && (
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Clientes usando esta versão
            </h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  UF
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {versionClients.map((versionClient, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {versionClient.clients?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {versionClient.clients?.uf}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lista de Versões Recentes */}
      <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Versões Recentes
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
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
                Data de Criação
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {versions.slice(0, 10).map((version) => (
              <tr key={version.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {version.modules?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {version.version_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {version.tag}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(version.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}