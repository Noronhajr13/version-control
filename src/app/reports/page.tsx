'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import type { Database } from '@/src/lib/types/database'
import { FileText, Users, Package } from 'lucide-react'

export default function ReportsPage() {
  type Module = Database['public']['Tables']['modules']['Row']
  type Version = Database['public']['Tables']['versions']['Row'] & { modules?: { name: string } }
  type ModuleVersion = Version & { cards?: { count: number }[] }
  type VersionClient = Database['public']['Tables']['version_clients']['Row'] & { clients?: { name: string; uf: string } }

  const [modules, setModules] = useState<Module[]>([])
  const [versions, setVersions] = useState<Version[]>([])
  const [selectedModule, setSelectedModule] = useState('')
  const [selectedVersion, setSelectedVersion] = useState('')
  const [moduleVersions, setModuleVersions] = useState<ModuleVersion[]>([])
  const [versionClients, setVersionClients] = useState<VersionClient[]>([])
  
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
    const [modulesRes, versionsRes] = await Promise.all([
      supabase.from('modules').select('*').order('name'),
      supabase.from('versions').select('*, modules(name)').order('created_at', { ascending: false })
    ])

    if (modulesRes.data) setModules(modulesRes.data)
    if (versionsRes.data) setVersions(versionsRes.data)
  }

  const loadModuleVersions = async () => {
    const { data } = await supabase
      .from('versions')
      .select('*, cards(count)')
      .eq('module_id', selectedModule)
      .order('release_date', { ascending: false })

    if (data) setModuleVersions(data)
  }

  const loadVersionClients = async () => {
    const { data } = await supabase
      .from('version_clients')
      .select('*, clients(name, uf)')
      .eq('version_id', selectedVersion)
      .order('clients(name)')

    if (data) setVersionClients(data)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Relatórios
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Relatório de Versões por Módulo */}
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Package className="w-5 h-5 mr-2 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Versões por Módulo
            </h2>
          </div>

          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full px-3 py-2 mb-4 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Selecione um módulo...</option>
            {modules.map(module => (
              <option key={module.id} value={module.id}>{module.name}</option>
            ))}
          </select>

          {selectedModule && moduleVersions.length > 0 && (
            <div className="space-y-3">
              {moduleVersions.map(version => (
                <div key={version.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {version.version_number} - {version.tag}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Liberado em: {version.release_date ? new Date(version.release_date).toLocaleDateString('pt-BR') : 'Não definido'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Cards: {version.cards?.[0]?.count || 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Relatório de Clientes por Versão */}
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 mr-2 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Clientes por Versão
            </h2>
          </div>

          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="w-full px-3 py-2 mb-4 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Selecione uma versão...</option>
            {versions.map(version => (
              <option key={version.id} value={version.id}>
                {version.modules?.name} - {version.version_number}
              </option>
            ))}
          </select>

          {selectedVersion && versionClients.length > 0 && (
            <div className="space-y-2">
              {versionClients.map(vc => (
                <div key={vc.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">
                    {vc.clients?.name}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {vc.clients?.uf}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {selectedVersion && versionClients.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Nenhum cliente usando esta versão
            </p>
          )}
        </div>
      </div>
    </div>
  )
}