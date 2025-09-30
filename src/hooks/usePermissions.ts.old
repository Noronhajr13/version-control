'use client'

import { useAuth } from './useAuth'
import { UserRole } from '@/src/lib/types/database'

// Recursos disponíveis no sistema
export const RESOURCES = {
  VERSIONS: 'versions',
  CLIENTS: 'clients', 
  MODULES: 'modules',
  AUDIT: 'audit',
  USERS: 'users',
  REPORTS: 'reports'
} as const

// Ações disponíveis
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  EXPORT: 'export'
} as const

type Resource = typeof RESOURCES[keyof typeof RESOURCES]
type Action = typeof ACTIONS[keyof typeof ACTIONS]

// Mapa de permissões padrão por role (sistema simplificado - 3 roles)
const DEFAULT_PERMISSIONS: Record<UserRole, Record<string, boolean>> = {
  admin: {
    // Admin tem acesso total a tudo
    'versions_create': true,
    'versions_read': true,
    'versions_update': true,
    'versions_delete': true,
    'clients_create': true,
    'clients_read': true,
    'clients_update': true,
    'clients_delete': true,
    'modules_create': true,
    'modules_read': true,
    'modules_update': true,
    'modules_delete': true,
    'audit_read': true,
    'audit_export': true,
    'users_create': true,
    'users_read': true,
    'users_update': true,
    'users_delete': true,
    'users_manage': true,
    'reports_read': true,
    'reports_export': true,
  },
  manager: {
    // Manager pode criar, ler e editar, mas não deletar nem gerenciar usuários
    'versions_create': true,
    'versions_read': true,
    'versions_update': true,
    'versions_delete': false,
    'clients_create': true,
    'clients_read': true,
    'clients_update': true,
    'clients_delete': false,
    'modules_create': true,
    'modules_read': true,
    'modules_update': true,
    'modules_delete': false,
    'audit_read': true,
    'audit_export': false,
    'users_create': false,
    'users_read': false,
    'users_update': false,
    'users_delete': false,
    'users_manage': false,
    'reports_read': true,
    'reports_export': true,
  },
  viewer: {
    // Viewer só pode visualizar
    'versions_create': false,
    'versions_read': true,
    'versions_update': false,
    'versions_delete': false,
    'clients_create': false,
    'clients_read': true,
    'clients_update': false,
    'clients_delete': false,
    'modules_create': false,
    'modules_read': true,
    'modules_update': false,
    'modules_delete': false,
    'audit_read': false,
    'audit_export': false,
    'users_create': false,
    'users_read': false,
    'users_update': false,
    'users_delete': false,
    'users_manage': false,
    'reports_read': true,
    'reports_export': false,
  }
}

export function usePermissions() {
  const { userProfile } = useAuth()
  
  const role = userProfile?.role || null

  // Função para verificar permissão específica
  const hasPermission = (resource: Resource, action: Action): boolean => {
    if (!role) return false
    
    // Admin tem acesso total
    if (role === 'admin') return true
    
    const permissionKey = `${resource}_${action}`
    const rolePermissions = DEFAULT_PERMISSIONS[role]
    
    return rolePermissions?.[permissionKey] ?? false
  }

  // Função para verificar múltiplas permissões
  const hasAnyPermission = (permissions: Array<{ resource: Resource; action: Action }>): boolean => {
    return permissions.some(({ resource, action }) => hasPermission(resource, action))
  }

  // Função para verificar se pode acessar recurso (ao menos leitura)
  const canAccess = (resource: Resource): boolean => {
    return hasPermission(resource, ACTIONS.READ)
  }

  // Função para verificar se pode modificar recurso
  const canModify = (resource: Resource): boolean => {
    return hasAnyPermission([
      { resource, action: ACTIONS.CREATE },
      { resource, action: ACTIONS.UPDATE },
      { resource, action: ACTIONS.DELETE }
    ])
  }

  // Helpers para roles específicas
  const isAdmin = () => role === 'admin'
  const isManager = () => role === 'manager' || isAdmin()
  const isViewer = () => role === 'viewer'

  // Helpers para verificações específicas
  const canManageUsers = () => hasPermission(RESOURCES.USERS, ACTIONS.MANAGE)
  const canExportData = () => {
    return hasAnyPermission([
      { resource: RESOURCES.AUDIT, action: ACTIONS.EXPORT },
      { resource: RESOURCES.REPORTS, action: ACTIONS.EXPORT }
    ])
  }

  // Verificar se pode deletar qualquer recurso
  const canDelete = (resource: Resource) => hasPermission(resource, ACTIONS.DELETE)

  return {
    // Estado
    role,
    userProfile,
    
    // Verificações de permissão
    hasPermission,
    hasAnyPermission,
    canAccess,
    canModify,
    canDelete,
    
    // Helpers de role
    isAdmin,
    isManager, 
    isViewer,
    
    // Verificações específicas
    canManageUsers,
    canExportData,
    
    // Recursos e ações disponíveis
    RESOURCES,
    ACTIONS
  }
}
