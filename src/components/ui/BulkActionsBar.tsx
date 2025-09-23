'use client'

import { useState } from 'react'
import { Trash2, Edit, Eye, MoreHorizontal, CheckSquare, Square } from 'lucide-react'
import { toast } from 'sonner'

interface BulkActionsBarProps {
  selectedItems: string[]
  totalItems: number
  onSelectAll: () => void
  onDeselectAll: () => void
  onDelete: (ids: string[]) => Promise<void>
  onEdit?: (ids: string[]) => void
  itemType: 'versões' | 'módulos' | 'clientes'
}

export function BulkActionsBar({
  selectedItems,
  totalItems,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onEdit,
  itemType
}: BulkActionsBarProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const selectedCount = selectedItems.length
  const allSelected = selectedCount === totalItems && totalItems > 0

  const handleDelete = async () => {
    if (selectedCount === 0) return

    const confirmMessage = `Tem certeza que deseja deletar ${selectedCount} ${itemType}? Esta ação não pode ser desfeita.`
    
    if (!confirm(confirmMessage)) return

    try {
      setIsDeleting(true)
      await onDelete(selectedItems)
      toast.success(`${selectedCount} ${itemType} deletadas com sucesso`)
    } catch (error) {
      toast.error(`Erro ao deletar ${itemType}`)
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    if (selectedCount === 0) return
    if (selectedCount > 10) {
      toast.error('Selecione no máximo 10 itens para edição em lote')
      return
    }
    onEdit?.(selectedItems)
  }

  if (selectedCount === 0) return null

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            {allSelected ? (
              <CheckSquare className="w-5 h-5" />
            ) : (
              <Square className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">
              {allSelected ? 'Desmarcar todos' : `Selecionar todos (${totalItems})`}
            </span>
          </button>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {selectedCount}
            </span> {itemType} selecionadas
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onEdit && selectedCount <= 10 && (
            <button
              onClick={handleEdit}
              className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span className="text-sm">Editar</span>
            </button>
          )}
          
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center space-x-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm">
              {isDeleting ? 'Deletando...' : 'Deletar'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}