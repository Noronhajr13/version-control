'use client'

import { useVersions, useDeleteVersion } from '@/src/lib/react-query/hooks'
import { useBulkSelection } from '@/src/hooks/useBulkSelection'
import { useKeyboardShortcuts } from '@/src/hooks/useKeyboardShortcuts'
import Link from 'next/link'
import { Plus, Eye, Edit, Search, ExternalLink, Package, Code, ChevronDown, ChevronRight } from 'lucide-react'
import { BulkActionsBar } from '@/src/components/ui/BulkActionsBar'
import { SelectionCheckbox } from '@/src/components/ui/SelectionCheckbox'
import { KeyboardShortcutsHelp } from '@/src/components/ui/KeyboardShortcutsHelp'
import { QuickActions } from '@/src/components/ui/QuickActions'
import { useCustomToast } from '@/src/hooks/useCustomToast'
import { useState, useMemo } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function VersionsPage() {
  const { data: versions = [], error, isLoading } = useVersions()
  const deleteVersionMutation = useDeleteVersion()
  const [searchTerm, setSearchTerm] = useState('')
  const customToast = useCustomToast()

  // Estado para controlar grupos expandidos
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})
  const [expandedPowerBuilder, setExpandedPowerBuilder] = useState<Record<string, boolean>>({})

  // Filter and group versions
  const { filteredVersions, groupedVersions } = useMemo(() => {
    let filtered = versions
    if (searchTerm) {
      filtered = versions.filter((version: any) => 
        version.modules?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        version.version_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        version.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        version.powerbuilder_version?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Agrupar por módulo e depois por versão PowerBuilder
    const grouped = filtered.reduce((acc: any, version: any) => {
      const moduleName = version.modules?.name || 'Sem Módulo'
      const pbVersion = version.powerbuilder_version || 'Sem PowerBuilder'
      
      if (!acc[moduleName]) {
        acc[moduleName] = {}
      }
      if (!acc[moduleName][pbVersion]) {
        acc[moduleName][pbVersion] = []
      }
      
      acc[moduleName][pbVersion].push(version)
      return acc
    }, {})

    // Ordenar módulos alfabeticamente e versões por data de geração (mais recente primeiro)
    Object.keys(grouped).sort().forEach(moduleName => {
      Object.keys(grouped[moduleName]).forEach(pbVersion => {
        grouped[moduleName][pbVersion].sort((a: any, b: any) => {
          const dateA = new Date(a.data_generation || a.created_at)
          const dateB = new Date(b.data_generation || b.created_at)
          return dateB.getTime() - dateA.getTime()
        })
      })
    })

    return { filteredVersions: filtered, groupedVersions: grouped }
  }, [versions, searchTerm])

  // Funções para expandir/colapsar grupos
  const toggleModule = (moduleName: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }))
  }

  const togglePowerBuilder = (key: string) => {
    setExpandedPowerBuilder(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Função para obter cor do status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'producao':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'testes':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'interna':
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'producao': return 'Produção'
      case 'testes': return 'Testes'
      case 'interna': return 'Interna'
      default: return 'Interna'
    }
  }

  // Bulk selection
  const {
    selectedItems,
    selectedCount,
    isSelected,
    toggleSelection,
    selectAll,
    deselectAll,
    isAllSelected
  } = useBulkSelection({ 
    items: filteredVersions,
    maxSelection: 50 
  })

  // Bulk delete handler
  const handleBulkDelete = async (ids: string[]) => {
    const deletePromises = ids.map(id => deleteVersionMutation.mutateAsync(id))
    await Promise.all(deletePromises)
  }

  // Bulk edit handler
  const handleBulkEdit = (ids: string[]) => {
    customToast.info(`Edição em lote de ${ids.length} versões será implementada em breve`)
  }

  // Keyboard shortcuts
  const shortcuts = useMemo(() => ({
    newVersion: {
      shortcut: { key: 'n', ctrl: true },
      handler: () => window.location.href = '/dashboard/versions/new',
      description: 'Nova versão'
    },
    selectAll: {
      shortcut: { key: 'a', ctrl: true },
      handler: (e: KeyboardEvent) => {
        e.preventDefault()
        if (isAllSelected) {
          deselectAll()
        } else {
          selectAll()
        }
      },
      description: 'Selecionar todos'
    },
    search: {
      shortcut: { key: 'f', ctrl: true },
      handler: (e: KeyboardEvent) => {
        e.preventDefault()
        document.getElementById('search-input')?.focus()
      },
      description: 'Buscar'
    },
    deleteSelected: {
      shortcut: { key: 'Delete' },
      handler: () => {
        if (selectedCount > 0) {
          handleBulkDelete(selectedItems)
        }
      },
      description: 'Deletar selecionados',
      disabled: selectedCount === 0
    }
  }), [isAllSelected, selectAll, deselectAll, selectedCount, selectedItems])

  useKeyboardShortcuts({ shortcuts })

  // Quick Actions
  const quickActions = useMemo(() => [
    {
      id: 'new-version',
      label: 'Nova Versão',
      description: 'Criar uma nova versão',
      icon: Plus,
      shortcut: { key: 'n', ctrl: true },
      action: () => { window.location.href = '/dashboard/versions/new' },
      category: 'creation' as const
    },
    {
      id: 'select-all',
      label: isAllSelected ? 'Desselecionar Todos' : 'Selecionar Todos',
      description: `${isAllSelected ? 'Desmarcar' : 'Marcar'} todas as versões`,
      icon: Search,
      shortcut: { key: 'a', ctrl: true },
      action: () => { isAllSelected ? deselectAll() : selectAll() },
      category: 'edit' as const
    },
    {
      id: 'delete-selected',
      label: 'Deletar Selecionados',
      description: `Deletar ${selectedCount} versões selecionadas`,
      icon: Search,
      action: () => { handleBulkDelete(selectedItems) },
      category: 'delete' as const,
      available: selectedCount > 0
    },
    {
      id: 'export-csv',
      label: 'Exportar CSV',
      description: 'Exportar versões para CSV',
      icon: Search,
      action: () => { customToast.info('Export CSV será implementado em breve') },
      category: 'export' as const
    }
  ], [isAllSelected, selectAll, deselectAll, selectedCount, selectedItems, handleBulkDelete, customToast])

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Versões
        </h1>
        <Link
          href="/dashboard/versions/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Versão
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            id="search-input"
            type="text"
            placeholder="Buscar por módulo, versão ou tag... (Ctrl+F)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4">
          Erro ao carregar versões: {error.message}
        </div>
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedItems={selectedItems}
        totalItems={filteredVersions.length}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onDelete={handleBulkDelete}
        onEdit={handleBulkEdit}
        itemType="versões"
      />

      {/* Versões Agrupadas */}
      <div className="space-y-6">
        {Object.keys(groupedVersions).sort().map(moduleName => (
          <div key={moduleName} className="bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header do Módulo */}
            <div 
              className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-colors"
              onClick={() => toggleModule(moduleName)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg mr-3">
                    <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {moduleName}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Quantidade: {Object.values(groupedVersions[moduleName]).flat().length}
                    </p>
                  </div>
                </div>
                {expandedModules[moduleName] ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </div>

            {/* Conteúdo do Módulo */}
            {expandedModules[moduleName] && (
              <div className="p-6">
                {Object.keys(groupedVersions[moduleName]).map(pbVersion => {
                  const pbKey = `${moduleName}-${pbVersion}`
                  return (
                    <div key={pbVersion} className="mb-6 last:mb-0">
                      {/* Header PowerBuilder */}
                      <div 
                        className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 px-4 py-3 rounded-lg mb-4 cursor-pointer hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-colors"
                        onClick={() => togglePowerBuilder(pbKey)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-purple-100 dark:bg-purple-900/50 p-1.5 rounded-md mr-3">
                              <Code className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                PowerBuilder {pbVersion}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Quantidade: {groupedVersions[moduleName][pbVersion].length}
                              </p>
                            </div>
                          </div>
                          {expandedPowerBuilder[pbKey] ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                      </div>

                      {/* Lista de Versões */}
                      {expandedPowerBuilder[pbKey] && (
                        <div className="space-y-3">
                          {groupedVersions[moduleName][pbVersion].map((version: any) => (
                            <div
                              key={version.id}
                              className={`bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow ${
                                isSelected(version.id) ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                {/* Checkbox e informações principais */}
                                <div className="flex items-center space-x-4 flex-1">
                                  <SelectionCheckbox
                                    checked={isSelected(version.id)}
                                    onChange={() => toggleSelection(version.id)}
                                  />
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1 items-center">
                                    {/* Versão */}
                                    <div>
                                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {version.version_number}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {version.tag}
                                      </div>
                                    </div>

                                    {/* Data de Geração */}
                                    <div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">Data Geração</div>
                                      <div className="text-sm text-gray-900 dark:text-white">
                                        {version.data_generation ? new Date(version.data_generation).toLocaleDateString('pt-BR') : '-'}
                                      </div>
                                    </div>

                                    {/* Data de Liberação */}
                                    <div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">Data Liberação</div>
                                      <div className="text-sm text-gray-900 dark:text-white">
                                        {version.release_date ? new Date(version.release_date).toLocaleDateString('pt-BR') : '-'}
                                      </div>
                                    </div>

                                    {/* Link EXE */}
                                    <div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">Link EXE</div>
                                      {version.exe_path ? (
                                        <a 
                                          href={version.exe_path}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center text-sm"
                                        >
                                          <ExternalLink className="w-3 h-3 mr-1" />
                                          Abrir
                                        </a>
                                      ) : (
                                        <span className="text-sm text-gray-400">-</span>
                                      )}
                                    </div>

                                    {/* Status */}
                                    <div>
                                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(version.status || 'interna')}`}>
                                        {getStatusLabel(version.status || 'interna')}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Ações */}
                                <div className="flex space-x-2">
                                  <Link
                                    href={`/dashboard/versions/${version.id}`}
                                    className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                    title="Visualizar"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                  <Link
                                    href={`/dashboard/versions/${version.id}/edit`}
                                    className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                    title="Editar"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}

        {Object.keys(groupedVersions).length === 0 && (
          <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Nenhuma versão encontrada' : 'Nenhuma versão cadastrada'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando sua primeira versão'}
            </p>
            {!searchTerm && (
              <Link
                href="/dashboard/versions/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Versão
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Results Counter */}
      {searchTerm && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          {filteredVersions.length} versão(ões) encontrada(s) de {versions.length} total
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp 
        shortcuts={Object.entries(shortcuts)
          .filter(([_, config]) => !(config as any).disabled)
          .map(([name, config]) => ({
            name,
            shortcut: `${(config.shortcut as any).ctrl ? 'Ctrl + ' : ''}${config.shortcut.key}`,
            description: config.description
          }))
        }
      />

      {/* Quick Actions */}
      <QuickActions actions={quickActions} />
    </div>
  )
}