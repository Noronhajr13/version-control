import { useEffect, useCallback, useRef } from 'react'

type KeyboardShortcut = {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
}

type ShortcutHandler = (e: KeyboardEvent) => void

interface UseKeyboardShortcutsProps {
  shortcuts: Record<string, {
    shortcut: KeyboardShortcut
    handler: ShortcutHandler
    description: string
    disabled?: boolean
  }>
  enabled?: boolean
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) {
  const handlersRef = useRef(shortcuts)
  
  // Update handlers ref when shortcuts change
  handlersRef.current = shortcuts

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return
    
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    Object.entries(handlersRef.current).forEach(([name, config]) => {
      if (config.disabled) return
      
      const { shortcut, handler } = config
      const { key, ctrl, shift, alt, meta } = shortcut

      const keyMatch = e.key.toLowerCase() === key.toLowerCase()
      const ctrlMatch = !ctrl || e.ctrlKey
      const shiftMatch = !shift || e.shiftKey
      const altMatch = !alt || e.altKey
      const metaMatch = !meta || e.metaKey

      // Ensure exact modifier match
      const ctrlExact = ctrl ? e.ctrlKey : !e.ctrlKey
      const shiftExact = shift ? e.shiftKey : !e.shiftKey
      const altExact = alt ? e.altKey : !e.altKey
      const metaExact = meta ? e.metaKey : !e.metaKey

      if (keyMatch && ctrlExact && shiftExact && altExact && metaExact) {
        e.preventDefault()
        handler(e)
      }
    })
  }, [enabled])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const getShortcutText = useCallback((shortcut: KeyboardShortcut): string => {
    const parts: string[] = []
    
    if (shortcut.ctrl) parts.push('Ctrl')
    if (shortcut.meta) parts.push('Cmd')
    if (shortcut.alt) parts.push('Alt')
    if (shortcut.shift) parts.push('Shift')
    parts.push(shortcut.key.toUpperCase())
    
    return parts.join(' + ')
  }, [])

  const getEnabledShortcuts = useCallback(() => {
    return Object.entries(shortcuts)
      .filter(([_, config]) => !config.disabled)
      .map(([name, config]) => ({
        name,
        shortcut: getShortcutText(config.shortcut),
        description: config.description
      }))
  }, [shortcuts, getShortcutText])

  return {
    getShortcutText,
    getEnabledShortcuts
  }
}