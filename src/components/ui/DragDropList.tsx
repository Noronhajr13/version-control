'use client'

import { useState, useRef, DragEvent, ReactNode } from 'react'
import { GripVertical } from 'lucide-react'

interface DraggableItemProps {
  id: string
  index: number
  onDragStart: (index: number) => void
  onDragEnd: () => void
  onDragOver: (e: DragEvent) => void
  onDrop: (dragIndex: number, hoverIndex: number) => void
  isDragging: boolean
  children: ReactNode
  className?: string
}

export function DraggableItem({
  id,
  index,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
  children,
  className = ''
}: DraggableItemProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData('text/plain', index.toString())
    onDragStart(index)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    onDragOver(e)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
    onDrop(dragIndex, index)
  }

  return (
    <div
      ref={ref}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        group relative transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
        ${className}
      `}
    >
      {/* Drag Handle */}
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10">
        <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
      </div>
      
      {/* Content */}
      <div className="ml-6">
        {children}
      </div>
    </div>
  )
}

interface DragDropListProps<T> {
  items: T[]
  onReorder: (newItems: T[]) => void
  itemKey: (item: T) => string
  renderItem: (item: T, index: number, isDragging: boolean) => ReactNode
  className?: string
  itemClassName?: string
}

export function DragDropList<T>({
  items,
  onReorder,
  itemKey,
  renderItem,
  className = '',
  itemClassName = ''
}: DragDropListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const newItems = [...items]
    const draggedItem = newItems[dragIndex]
    
    // Remove dragged item
    newItems.splice(dragIndex, 1)
    
    // Insert at new position
    newItems.splice(hoverIndex, 0, draggedItem)
    
    onReorder(newItems)
  }

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (dragIdx: number, hoverIdx: number) => {
    if (dragIdx !== hoverIdx) {
      moveItem(dragIdx, hoverIdx)
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, index) => (
        <DraggableItem
          key={itemKey(item)}
          id={itemKey(item)}
          index={index}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={dragIndex === index}
          className={itemClassName}
        >
          {renderItem(item, index, dragIndex === index)}
        </DraggableItem>
      ))}
    </div>
  )
}