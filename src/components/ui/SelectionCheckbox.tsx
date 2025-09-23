'use client'

import { CheckSquare, Square, Minus } from 'lucide-react'

interface SelectionCheckboxProps {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function SelectionCheckbox({
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  size = 'md',
  className = ''
}: SelectionCheckboxProps) {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  
  const baseStyles = `
    cursor-pointer transition-colors
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-600 dark:hover:text-blue-400'}
    ${checked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}
    ${className}
  `

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={baseStyles}
      aria-checked={indeterminate ? 'mixed' : checked}
      role="checkbox"
      tabIndex={disabled ? -1 : 0}
    >
      {indeterminate ? (
        <Minus className={iconSize} />
      ) : checked ? (
        <CheckSquare className={iconSize} />
      ) : (
        <Square className={iconSize} />
      )}
    </button>
  )
}