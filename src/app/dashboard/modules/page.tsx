'use client'

import { useModules, useDeleteModule } from '@/lib/react-query/hooks'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import Link from 'next/link'
import { Plus, Edit, Search } from 'lucide-react'
import DeleteModuleButton from '@/app/modules/DeleteModuleButton'
import { BulkActionsBar } from '@/components/ui/BulkActionsBar'
import { SelectionCheckbox } from '@/components/ui/SelectionCheckbox'
import { KeyboardShortcutsHelp } from '@/components/ui/KeyboardShortcutsHelp'
import { useCustomToast } from '@/hooks/useCustomToast'
import { useState, useMemo } from 'react'

export default function ModulesPage() {
  const { data: modules = [], error, isLoading } = useModules()
  const deleteModuleMutation = useDeleteModule()
  const [searchTerm, setSearchTerm] = useState('')
  const customToast = useCustomToast()

  // Debug log para identificar re-renders
  console.log('ModulesPage render:', { 
    modulesCount: modules.length, 
    isLoading, 
    hasError: !!error 
  })

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!searchTerm) return modules
    return modules.filter((module: any) => 
      module.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [modules, searchTerm])

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
    items: filteredModules,
    maxSelection: 50 
  })

  // Bulk delete handler
  const handleBulkDelete = async (ids: string[]) => {
    const deletePromises = ids.map(id => deleteModuleMutation.mutateAsync(id))
    await Promise.all(deletePromises)
  }

  // Bulk edit handler
  const handleBulkEdit = (ids: string[]) => {
    customToast.info(`Edição em lote de ${ids.length} módulos será implementada em breve`)
  }

  // Keyboard shortcuts
  const shortcuts = useMemo(() => ({
    newModule: {
      shortcut: { key: 'n', ctrl: true },
      handler: () => window.location.href = '/dashboard/modules/new',
      description: 'Novo módulo'
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

  return (
    <div>
      {/* Header */}
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

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            id="search-input"
            type="text"
            placeholder="Buscar por nome ou descrição... (Ctrl+F)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          Erro ao carregar módulos: {error.message}
        </div>
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedItems={selectedItems}
        totalItems={filteredModules.length}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onDelete={handleBulkDelete}
        onEdit={handleBulkEdit}
        itemType="módulos"
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Modules Table */}
      {!isLoading && (
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left">
                  <SelectionCheckbox
                    checked={isAllSelected}
                    indeterminate={selectedCount > 0 && !isAllSelected}
                    onChange={() => isAllSelected ? deselectAll() : selectAll()}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data de Criação
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredModules?.map((module: any) => (
                <tr 
                  key={module.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    isSelected(module.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SelectionCheckbox
                      checked={isSelected(module.id)}
                      onChange={() => toggleSelection(module.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {module.name}
                    </div>
                    {module.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {module.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(module.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/dashboard/modules/${module.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <DeleteModuleButton moduleId={module.id} moduleName={module.name} />
                    </div>
                  </td>
                </tr>
              ))}
              {filteredModules?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Nenhum módulo encontrado para a busca' : 'Nenhum módulo cadastrado'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Results Counter */}
      {searchTerm && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          {filteredModules.length} módulo(s) encontrado(s) de {modules.length} total
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
    </div>
  )
}