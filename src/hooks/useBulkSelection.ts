import { useState, useCallback, useMemo } from 'react'

interface UseBulkSelectionProps {
  items: Array<{ id: string }>
  maxSelection?: number
}

export function useBulkSelection({ items, maxSelection }: UseBulkSelectionProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const selectedItems = useMemo(() => 
    Array.from(selectedIds), 
    [selectedIds]
  )

  const isSelected = useCallback((id: string) => 
    selectedIds.has(id), 
    [selectedIds]
  )

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        // Check max selection limit
        if (maxSelection && newSet.size >= maxSelection) {
          return prev // Don't add if limit reached
        }
        newSet.add(id)
      }
      
      return newSet
    })
  }, [maxSelection])

  const selectAll = useCallback(() => {
    const itemsToSelect = maxSelection 
      ? items.slice(0, maxSelection) 
      : items
    
    setSelectedIds(new Set(itemsToSelect.map(item => item.id)))
  }, [items, maxSelection])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const selectRange = useCallback((startId: string, endId: string) => {
    const startIndex = items.findIndex(item => item.id === startId)
    const endIndex = items.findIndex(item => item.id === endId)
    
    if (startIndex === -1 || endIndex === -1) return
    
    const [start, end] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)]
    const rangeItems = items.slice(start, end + 1)
    
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      rangeItems.forEach(item => {
        if (!maxSelection || newSet.size < maxSelection) {
          newSet.add(item.id)
        }
      })
      return newSet
    })
  }, [items, maxSelection])

  const isAllSelected = useMemo(() => {
    if (items.length === 0) return false
    const selectableCount = maxSelection ? Math.min(items.length, maxSelection) : items.length
    return selectedIds.size === selectableCount
  }, [selectedIds.size, items.length, maxSelection])

  const selectedCount = selectedIds.size
  const canSelectMore = !maxSelection || selectedCount < maxSelection

  return {
    selectedItems,
    selectedCount,
    isSelected,
    toggleSelection,
    selectAll,
    deselectAll,
    selectRange,
    isAllSelected,
    canSelectMore,
    maxSelection
  }
}