'use client'

import React, { ReactNode } from 'react'
import { usePermissions, RESOURCES, ACTIONS } from '@/src/hooks/usePermissions'
import { UserRole } from '@/src/lib/types/database'
import { Card } from '@/src/components/ui/Card'

interface ProtectedComponentProps {
  children: ReactNode
  resource?: typeof RESOURCES[keyof typeof RESOURCES]
  action?: typeof ACTIONS[keyof typeof ACTIONS]
  role?: UserRole | UserRole[]
  fallback?: ReactNode
  requireAll?: boolean // Se true, requer TODAS as condições. Se false (padrão), requer qualquer uma
}

export function ProtectedComponent({
  children,
  resource,
  action,
  role,
  fallback = null,
  requireAll = false
}: ProtectedComponentProps) {
  const permissions = usePermissions()

  // Verificações de acesso
  const checks: boolean[] = []

  // Verificar permissão de recurso/ação
  if (resource && action) {
    checks.push(permissions.hasPermission(resource, action))
  }

  // Verificar role
  if (role) {
    const requiredRoles = Array.isArray(role) ? role : [role]
    const hasRole = requiredRoles.includes(permissions.role as UserRole)
    checks.push(hasRole)
  }

  // Verificar se usuário está ativo (assume que se tem userProfile, está ativo)
  if (permissions.userProfile) {
    checks.push(true)
  }

  // Se não há checks específicos, apenas verificar se está logado
  if (checks.length === 0 && permissions.userProfile) {
    checks.push(true)
  }

  // Determinar acesso baseado em requireAll
  const hasAccess = requireAll 
    ? checks.length > 0 && checks.every(check => check)
    : checks.some(check => check)

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Componente específico para mostrar conteúdo apenas para admins
export function AdminOnly({ 
  children, 
  fallback = <UnauthorizedMessage /> 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <ProtectedComponent role={['admin']} fallback={fallback}>
      {children}
    </ProtectedComponent>
  )
}

// Componente específico para mostrar conteúdo apenas para managers+
export function ManagerOnly({ 
  children, 
  fallback = <UnauthorizedMessage /> 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <ProtectedComponent role={['admin', 'manager']} fallback={fallback}>
      {children}
    </ProtectedComponent>
  )
}

// Componente específico para ações de criação
export function CreateAccess({ 
  resource, 
  children, 
  fallback 
}: { 
  resource: typeof RESOURCES[keyof typeof RESOURCES]
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <ProtectedComponent resource={resource} action={ACTIONS.CREATE} fallback={fallback}>
      {children}
    </ProtectedComponent>
  )
}

// Componente específico para ações de edição
export function EditAccess({ 
  resource, 
  children, 
  fallback 
}: { 
  resource: typeof RESOURCES[keyof typeof RESOURCES]
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <ProtectedComponent resource={resource} action={ACTIONS.UPDATE} fallback={fallback}>
      {children}
    </ProtectedComponent>
  )
}

// Componente específico para ações de exclusão
export function DeleteAccess({ 
  resource, 
  children, 
  fallback 
}: { 
  resource: typeof RESOURCES[keyof typeof RESOURCES]
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <ProtectedComponent resource={resource} action={ACTIONS.DELETE} fallback={fallback}>
      {children}
    </ProtectedComponent>
  )
}

// Mensagem padrão de não autorizado
function UnauthorizedMessage() {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-5V9m0 0V7m0 2h2m-2 0H10" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Acesso Negado
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Você não tem permissão para ver este conteúdo.
      </p>
    </Card>
  )
}

// HOC para proteger páginas inteiras
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  resource?: typeof RESOURCES[keyof typeof RESOURCES],
  action?: typeof ACTIONS[keyof typeof ACTIONS],
  role?: UserRole | UserRole[]
) {
  return function PermissionProtectedComponent(props: P) {
    return (
      <ProtectedComponent resource={resource} action={action} role={role}>
        <WrappedComponent {...props} />
      </ProtectedComponent>
    )
  }
}

// Hook para proteger funções/handlers
export function useProtectedAction() {
  const permissions = usePermissions()
  
  const withPermissionCheck = (
    resource: typeof RESOURCES[keyof typeof RESOURCES],
    action: typeof ACTIONS[keyof typeof ACTIONS],
    callback: () => void | Promise<void>,
    onUnauthorized?: () => void
  ) => {
    return async () => {
      if (permissions.hasPermission(resource, action)) {
        await callback()
      } else {
        if (onUnauthorized) {
          onUnauthorized()
        } else {
          alert('Você não tem permissão para executar esta ação.')
        }
      }
    }
  }
  
  return { withPermissionCheck }
}