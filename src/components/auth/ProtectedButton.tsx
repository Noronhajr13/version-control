'use client'

import React from 'react'
import { useBasicPermissions } from '@/contexts/AuthContextBasic'
import { Button } from '@/components/ui/Button'

interface SimpleProtectedButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  adminOnly?: boolean
  managerOrAdmin?: boolean
  fallbackType?: 'hide' | 'disable'
}

export function ProtectedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  adminOnly = false,
  managerOrAdmin = false,
  fallbackType = 'hide'
}: SimpleProtectedButtonProps) {
  const { isAdmin, isManager } = useBasicPermissions()

  // Verificar permissões
  let hasPermission = true
  
  if (adminOnly) {
    hasPermission = isAdmin()
  } else if (managerOrAdmin) {
    hasPermission = isManager() || isAdmin()
  }

  // Se não tem permissão e deve esconder
  if (!hasPermission && fallbackType === 'hide') {
    return null
  }

  // Se não tem permissão e deve desabilitar
  const isDisabled = disabled || (!hasPermission && fallbackType === 'disable')

  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      className={className}
      disabled={isDisabled}
      type={type}
    >
      {children}
    </Button>
  )
}

// Componentes especializados
export function CreateButton(props: Omit<SimpleProtectedButtonProps, 'managerOrAdmin'>) {
  return <ProtectedButton {...props} managerOrAdmin />
}

export function EditButton(props: Omit<SimpleProtectedButtonProps, 'managerOrAdmin'>) {
  return <ProtectedButton {...props} managerOrAdmin />
}

export function DeleteButton(props: Omit<SimpleProtectedButtonProps, 'adminOnly'>) {
  return <ProtectedButton {...props} adminOnly />
}

export function AdminButton(props: Omit<SimpleProtectedButtonProps, 'adminOnly'>) {
  return <ProtectedButton {...props} adminOnly />
}