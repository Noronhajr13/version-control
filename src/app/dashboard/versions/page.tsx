'use client'

import { useVersions, useDeleteVersion } from '@/src/lib/react-query/hooks'
import { useBulkSelection } from '@/src/hooks/useBulkSelection'
import { useKeyboardShortcuts } from '@/src/hooks/useKeyboardShortcuts'
import Link from 'next/link'
import { Plus, Eye, Edit, Search } from 'lucide-react'
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

  // Filter versions based on search
  const filteredVersions = useMemo(() => {
    if (!searchTerm) return versions
    return versions.filter((version: any) => 
      version.modules?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      version.version_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      version.tag?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [versions, searchTerm])

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

      {/* Versions Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left">
                <SelectionCheckbox
                  checked={isAllSelected}
                  indeterminate={selectedCount > 0 && !isAllSelected}
                  onChange={() => isAllSelected ? deselectAll() : selectAll()}
                />
              </th>
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
            {filteredVersions?.map((version: any) => (
              <tr 
                key={version.id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  isSelected(version.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <SelectionCheckbox
                    checked={isSelected(version.id)}
                    onChange={() => toggleSelection(version.id)}
                  />
                </td>
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
                    href={`/dashboard/versions/${version.id}`}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                  >
                    <Eye className="w-4 h-4 inline" />
                  </Link>
                  <Link
                    href={`/dashboard/versions/${version.id}/edit`}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                  >
                    <Edit className="w-4 h-4 inline" />
                  </Link>
                </td>
              </tr>
            ))}
            {(!filteredVersions || filteredVersions.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'Nenhuma versão encontrada para a busca' : 'Nenhuma versão cadastrada'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
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