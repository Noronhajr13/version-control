'use client'

import React, { ReactNode } from 'react'
import { useBasicPermissions } from '@/contexts/AuthContextBasic'

type UserRole = 'admin' | 'manager' | 'viewer'

interface SimpleProtectedProps {
  children: ReactNode
  role?: UserRole | UserRole[]
  fallback?: ReactNode
  adminOnly?: boolean
  managerOrAdmin?: boolean
}

export function ProtectedComponent({
  children,
  role,
  fallback = null,
  adminOnly = false,
  managerOrAdmin = false
}: SimpleProtectedProps) {
  const { role: userRole, isAdmin, isManager } = useBasicPermissions()

  // Verificações simples
  let hasAccess = false

  if (adminOnly) {
    hasAccess = isAdmin()
  } else if (managerOrAdmin) {
    hasAccess = isManager() || isAdmin()
  } else if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role]
    hasAccess = userRole ? allowedRoles.includes(userRole) : false
  } else {
    // Se não especificar role, permite acesso
    hasAccess = true
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Componentes auxiliares simplificados
export function CanCreate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedComponent managerOrAdmin fallback={fallback}>
      {children}
    </ProtectedComponent>
  )
}

export function CanEdit({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedComponent managerOrAdmin fallback={fallback}>
      {children}
    </ProtectedComponent>
  )
}

export function CanDelete({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedComponent adminOnly fallback={fallback}>
      {children}
    </ProtectedComponent>
  )
}

export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedComponent adminOnly fallback={fallback}>
      {children}
    </ProtectedComponent>
  )
}

export function ManagerOrAdmin({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedComponent managerOrAdmin fallback={fallback}>
      {children}
    </ProtectedComponent>
  )
}