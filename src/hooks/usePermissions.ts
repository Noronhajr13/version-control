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
  MANAGE: 'manage', // Ação especial para gerenciamento completo
  EXPORT: 'export'
} as const

type Resource = typeof RESOURCES[keyof typeof RESOURCES]
type Action = typeof ACTIONS[keyof typeof ACTIONS]

// Mapa de permissões padrão por role
const DEFAULT_PERMISSIONS: Record<UserRole, Record<string, boolean>> = {
  super_admin: {
    // Super admin tem acesso total a tudo
    '*': true
  },
  admin: {
    // Admin tem acesso total exceto gerenciar super admins
    [`${RESOURCES.VERSIONS}_${ACTIONS.CREATE}`]: true,
    [`${RESOURCES.VERSIONS}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.VERSIONS}_${ACTIONS.UPDATE}`]: true,
    [`${RESOURCES.VERSIONS}_${ACTIONS.DELETE}`]: true,
    [`${RESOURCES.CLIENTS}_${ACTIONS.CREATE}`]: true,
    [`${RESOURCES.CLIENTS}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.CLIENTS}_${ACTIONS.UPDATE}`]: true,
    [`${RESOURCES.CLIENTS}_${ACTIONS.DELETE}`]: true,
    [`${RESOURCES.MODULES}_${ACTIONS.CREATE}`]: true,
    [`${RESOURCES.MODULES}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.MODULES}_${ACTIONS.UPDATE}`]: true,
    [`${RESOURCES.MODULES}_${ACTIONS.DELETE}`]: true,
    [`${RESOURCES.AUDIT}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.AUDIT}_${ACTIONS.EXPORT}`]: true,
    [`${RESOURCES.USERS}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.USERS}_${ACTIONS.MANAGE}`]: true,
    [`${RESOURCES.REPORTS}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.REPORTS}_${ACTIONS.EXPORT}`]: true,
  },
  manager: {
    // Manager pode criar, ler e editar, mas não deletar
    [`${RESOURCES.VERSIONS}_${ACTIONS.CREATE}`]: true,
    [`${RESOURCES.VERSIONS}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.VERSIONS}_${ACTIONS.UPDATE}`]: true,
    [`${RESOURCES.CLIENTS}_${ACTIONS.CREATE}`]: true,
    [`${RESOURCES.CLIENTS}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.CLIENTS}_${ACTIONS.UPDATE}`]: true,
    [`${RESOURCES.MODULES}_${ACTIONS.CREATE}`]: true,
    [`${RESOURCES.MODULES}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.MODULES}_${ACTIONS.UPDATE}`]: true,
    [`${RESOURCES.AUDIT}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.USERS}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.REPORTS}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.REPORTS}_${ACTIONS.EXPORT}`]: true,
  },
  editor: {
    // Editor pode criar, ler e editar (exceto usuários)
    [`${RESOURCES.VERSIONS}_${ACTIONS.CREATE}`]: true,
    [`${RESOURCES.VERSIONS}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.VERSIONS}_${ACTIONS.UPDATE}`]: true,
    [`${RESOURCES.CLIENTS}_${ACTIONS.CREATE}`]: true,
    [`${RESOURCES.CLIENTS}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.CLIENTS}_${ACTIONS.UPDATE}`]: true,
    [`${RESOURCES.MODULES}_${ACTIONS.CREATE}`]: true,
    [`${RESOURCES.MODULES}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.MODULES}_${ACTIONS.UPDATE}`]: true,
    [`${RESOURCES.REPORTS}_${ACTIONS.READ}`]: true,
  },
  viewer: {
    // Viewer pode apenas visualizar
    [`${RESOURCES.VERSIONS}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.CLIENTS}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.MODULES}_${ACTIONS.READ}`]: true,
    [`${RESOURCES.REPORTS}_${ACTIONS.READ}`]: true,
  }
}

export function usePermissions() {
  const { userProfile, role, permissions: userPermissions } = useAuth()

  const hasPermission = (resource: Resource, action: Action): boolean => {
    // Se não está autenticado
    if (!userProfile || !role) {
      return false
    }

    // Se usuário está inativo
    if (!userProfile.is_active) {
      return false
    }

    // Super admin tem acesso total
    if (role === 'super_admin') {
      return true
    }

    // Verificar permissão específica do usuário primeiro
    const specificPermission = userPermissions[`${resource}_${action}`]
    if (specificPermission !== undefined) {
      return specificPermission
    }

    // Verificar permissões padrão da role
    const defaultPermissions = DEFAULT_PERMISSIONS[role] || {}
    return defaultPermissions[`${resource}_${action}`] || false
  }

  const canCreate = (resource: Resource) => hasPermission(resource, ACTIONS.CREATE)
  const canRead = (resource: Resource) => hasPermission(resource, ACTIONS.READ)
  const canUpdate = (resource: Resource) => hasPermission(resource, ACTIONS.UPDATE)
  const canDelete = (resource: Resource) => hasPermission(resource, ACTIONS.DELETE)
  const canManage = (resource: Resource) => hasPermission(resource, ACTIONS.MANAGE)
  const canExport = (resource: Resource) => hasPermission(resource, ACTIONS.EXPORT)

  // Helpers específicos para recursos comuns
  const versions = {
    create: () => canCreate(RESOURCES.VERSIONS),
    read: () => canRead(RESOURCES.VERSIONS),
    update: () => canUpdate(RESOURCES.VERSIONS),
    delete: () => canDelete(RESOURCES.VERSIONS)
  }

  const clients = {
    create: () => canCreate(RESOURCES.CLIENTS),
    read: () => canRead(RESOURCES.CLIENTS),
    update: () => canUpdate(RESOURCES.CLIENTS),
    delete: () => canDelete(RESOURCES.CLIENTS)
  }

  const modules = {
    create: () => canCreate(RESOURCES.MODULES),
    read: () => canRead(RESOURCES.MODULES),
    update: () => canUpdate(RESOURCES.MODULES),
    delete: () => canDelete(RESOURCES.MODULES)
  }

  const audit = {
    read: () => canRead(RESOURCES.AUDIT),
    export: () => canExport(RESOURCES.AUDIT)
  }

  const users = {
    read: () => canRead(RESOURCES.USERS),
    manage: () => canManage(RESOURCES.USERS)
  }

  const reports = {
    read: () => canRead(RESOURCES.REPORTS),
    export: () => canExport(RESOURCES.REPORTS)
  }

  // Helpers para roles
  const isSuperAdmin = () => role === 'super_admin'
  const isAdmin = () => role === 'admin' || isSuperAdmin()
  const isManager = () => role === 'manager' || isAdmin()
  const isEditor = () => role === 'editor' || isManager()
  const isViewer = () => role === 'viewer' || isEditor()

  return {
    // Função genérica
    hasPermission,
    
    // Ações genéricas
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canManage,
    canExport,
    
    // Recursos específicos
    versions,
    clients,
    modules,
    audit,
    users,
    reports,
    
    // Role helpers
    isSuperAdmin,
    isAdmin,
    isManager,
    isEditor,
    isViewer,
    
    // Dados do usuário
    role,
    userProfile,
    isActive: userProfile?.is_active || false
  }
}

// Helper para usar em componentes - renderização condicional
export function useConditionalRender() {
  const permissions = usePermissions()
  
  const renderIf = (
    condition: boolean | (() => boolean),
    component: React.ReactNode
  ) => {
    const shouldRender = typeof condition === 'function' ? condition() : condition
    return shouldRender ? component : null
  }
  
  return { renderIf, ...permissions }
}