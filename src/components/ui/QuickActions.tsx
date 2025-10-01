'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Copy, Eye, Download, Upload } from 'lucide-react'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useCustomToast } from '@/hooks/useCustomToast'

interface QuickAction {
  id: string
  label: string
  description: string
  icon: React.ComponentType<any>
  shortcut?: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }
  action: () => void
  category: 'navigation' | 'creation' | 'edit' | 'delete' | 'export'
  available?: boolean
}

interface QuickActionsProps {
  actions: QuickAction[]
  trigger?: 'cmd-k' | 'slash' | 'both'
}

export function QuickActions({ actions, trigger = 'cmd-k' }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const customToast = useCustomToast()

  const availableActions = actions.filter(action => action.available !== false)
  
  const filteredActions = availableActions.filter(action =>
    action.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group actions by category
  const groupedActions = filteredActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = []
    }
    acc[action.category].push(action)
    return acc
  }, {} as Record<string, QuickAction[]>)

  const categoryLabels = {
    navigation: '🧭 Navegação',
    creation: '➕ Criar',
    edit: '✏️ Editar',
    delete: '🗑️ Deletar',
    export: '📤 Exportar'
  }

  // Keyboard shortcuts for opening
  const shortcuts = {
    openQuickActions: {
      shortcut: { key: 'k', ctrl: true },
      handler: (e: KeyboardEvent) => {
        e.preventDefault()
        setIsOpen(true)
        setSearchTerm('')
        setSelectedIndex(0)
      },
      description: 'Abrir ações rápidas'
    },
    ...(trigger === 'slash' || trigger === 'both' ? {
      openQuickActionsSlash: {
        shortcut: { key: '/' },
        handler: (e: KeyboardEvent) => {
          e.preventDefault()
          setIsOpen(true)
          setSearchTerm('')
          setSelectedIndex(0)
        },
        description: 'Abrir ações rápidas'
      }
    } : {})
  }

  useKeyboardShortcuts({ shortcuts, enabled: !isOpen })

  // Handle modal keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setIsOpen(false)
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, filteredActions.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredActions[selectedIndex]) {
            filteredActions[selectedIndex].action()
            setIsOpen(false)
            customToast.shortcutUsed('Enter', filteredActions[selectedIndex].label)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredActions, selectedIndex, customToast])

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchTerm])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center p-4 pt-16">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
        
        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-hidden">
          {/* Search Header */}
          <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Buscar ações... (use ↑↓ para navegar, Enter para executar)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500"
              autoFocus
            />
            <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
              Esc
            </kbd>
          </div>

          {/* Actions List */}
          <div className="max-h-80 overflow-y-auto">
            {Object.entries(groupedActions).map(([category, categoryActions]) => (
              <div key={category} className="p-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </div>
                {categoryActions.map((action, actionIndex) => {
                  const globalIndex = filteredActions.indexOf(action)
                  const Icon = action.icon
                  
                  return (
                    <button
                      key={action.id}
                      onClick={() => {
                        action.action()
                        setIsOpen(false)
                        customToast.shortcutUsed('Click', action.label)
                      }}
                      className={`w-full flex items-center px-3 py-2 text-left rounded-md transition-colors ${
                        globalIndex === selectedIndex
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{action.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {action.description}
                        </div>
                      </div>
                      {action.shortcut && (
                        <kbd className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded">
                          {action.shortcut.ctrl ? 'Ctrl+' : ''}{action.shortcut.key.toUpperCase()}
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
            
            {filteredActions.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma ação encontrada para "{searchTerm}"</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Ctrl+K para abrir • ↑↓ para navegar • Enter para executar</span>
              <span>{filteredActions.length} ações disponíveis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}