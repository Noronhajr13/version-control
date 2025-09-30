'use client'

import React from 'react'
import { useUIPermissions } from '@/src/contexts/AuthContext'
import { Button } from '@/src/components/ui/Button'

interface ProtectedButtonProps {
  elementKey: string
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  fallbackType?: 'hide' | 'disable' // Se esconde ou apenas desabilita quando sem permissão
}

export function ProtectedButton({
  elementKey,
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  fallbackType = 'hide',
  ...props
}: ProtectedButtonProps) {
  const { isVisible, isEnabled } = useUIPermissions()

  // Se não tem permissão de visualização e tipo é 'hide', não renderiza nada
  if (!isVisible(elementKey) && fallbackType === 'hide') {
    return null
  }

  // Se não tem permissão de visualização e tipo é 'disable', mostra desabilitado
  const shouldBeDisabled = disabled || !isEnabled(elementKey) || !isVisible(elementKey)

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={shouldBeDisabled}
      onClick={onClick}
      type={type}
      {...props}
    >
      {children}
    </Button>
  )
}

// Componente específico para ações de CRUD
interface CRUDButtonProps {
  action: 'create' | 'edit' | 'delete'
  resource: string
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  fallbackType?: 'hide' | 'disable'
}

export function CRUDButton({
  action,
  resource,
  children,
  onClick,
  variant,
  size = 'sm',
  className = '',
  disabled = false,
  fallbackType = 'hide',
  ...props
}: CRUDButtonProps) {
  // Gerar a chave do elemento baseada na ação e recurso
  const elementKey = `button_${action}_${resource}`
  
  // Definir variante padrão baseada na ação
  const defaultVariant = action === 'delete' ? 'outline' : 'primary'
  
  return (
    <ProtectedButton
      elementKey={elementKey}
      variant={variant || defaultVariant}
      size={size}
      className={`${className} ${action === 'delete' ? 'text-red-600 hover:text-red-700 border-red-300 hover:border-red-400' : ''}`}
      disabled={disabled}
      onClick={onClick}
      fallbackType={fallbackType}
      {...props}
    >
      {children}
    </ProtectedButton>
  )
}

// Hook para verificar permissões em componentes que não renderizam botões
export function useElementPermissions(elementKey: string) {
  const { isVisible, isEnabled } = useUIPermissions()
  
  return {
    isVisible: isVisible(elementKey),
    isEnabled: isEnabled(elementKey),
    canShow: isVisible(elementKey),
    canInteract: isVisible(elementKey) && isEnabled(elementKey)
  }
}