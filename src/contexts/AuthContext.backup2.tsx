// src/contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback, ReactNode } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { UserWithPermissions, UserRole } from '@/src/lib/types/database'

// ==================== RECURSOS E AÇÕES ====================
export const RESOURCES = {
  VERSIONS: 'versions',
  CLIENTS: 'clients', 
  MODULES: 'modules',
  AUDIT: 'audit',
  USERS: 'users',
  REPORTS: 'reports'
} as const

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

// ==================== PERMISSÕES PADRÃO POR ROLE ====================
const DEFAULT_PERMISSIONS: Record<UserRole, Record<string, boolean>> = {
  admin: {
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

// ==================== UI PERMISSIONS ====================
interface UIPermissions {
  [elementKey: string]: {
    visible: boolean
    enabled: boolean
  }
}

function getDefaultUIPermissionsByRole(role: string): UIPermissions {
  const allElements = [
    'sidebar_dashboard',
    'sidebar_modules',
    'sidebar_clients', 
    'sidebar_versions',
    'sidebar_reports',
    'sidebar_audit',
    'sidebar_users',
    'button_create_module',
    'button_edit_module',
    'button_delete_module',
    'button_create_client',
    'button_edit_client', 
    'button_delete_client',
    'button_create_version',
    'button_edit_version',
    'button_delete_version',
    'section_dashboard_metrics',
    'section_dashboard_charts',
    'feature_export_data',
    'feature_bulk_actions',
    'feature_advanced_filters'
  ]

  const permissions: UIPermissions = {}
  
  allElements.forEach(element => {
    permissions[element] = {
      visible: getDefaultUIPermissionForElement(role, element, 'visible'),
      enabled: getDefaultUIPermissionForElement(role, element, 'enabled')
    }
  })

  return permissions
}

function getDefaultUIPermissionForElement(role: string, elementKey: string, type: 'visible' | 'enabled'): boolean {
  if (role === 'admin') return true
  
  if (role === 'manager') {
    if (elementKey.includes('delete')) return false
    if (elementKey === 'sidebar_users') return false
    return true
  }
  
  if (role === 'viewer') {
    if (elementKey.includes('create')) return false
    if (elementKey.includes('edit')) return false
    if (elementKey.includes('delete')) return false
    if (elementKey === 'sidebar_users') return false
    if (elementKey === 'feature_export_data') return false
    return true
  }
  
  return false
}

// ==================== CONTEXT TYPE ====================
interface AuthContextType {
  // Auth básico
  user: User | null
  userProfile: UserWithPermissions | null
  loading: boolean
  refreshProfile: () => Promise<void>
  isAuthenticated: boolean
  role: UserRole | null
  permissions: Record<string, any>
  
  // Resource permissions
  hasPermission: (resource: Resource, action: Action) => boolean
  hasAnyPermission: (permissions: Array<{ resource: Resource; action: Action }>) => boolean
  canAccess: (resource: Resource) => boolean
  canModify: (resource: Resource) => boolean
  canDelete: (resource: Resource) => boolean
  
  // Role helpers
  isAdmin: () => boolean
  isManager: () => boolean
  isViewer: () => boolean
  
  // Specific checks
  canManageUsers: () => boolean
  canExportData: () => boolean
  
  // UI Permissions
  uiPermissions: UIPermissions
  uiLoading: boolean
  isUIVisible: (elementKey: string) => boolean
  isUIEnabled: (elementKey: string) => boolean
  checkUIPermissions: (elementKeys: string[], type?: 'visible' | 'enabled') => Record<string, boolean>
  refetchUIPermissions: () => Promise<void>
}

// ==================== CONTEXT ====================
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ==================== CACHE ====================
const profileCache = new Map<string, { data: UserWithPermissions | null, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000

// ==================== PROVIDER ====================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserWithPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [uiPermissions, setUIPermissions] = useState<UIPermissions>({})
  const [uiLoading, setUILoading] = useState(false)
  
  const supabase = useMemo(() => createClient(), [])
  const mounted = useRef(true)

  // Função para buscar perfil do usuário
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserWithPermissions | null> => {
    try {
      // Verificar cache primeiro
      const cached = profileCache.get(userId)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('📦 Usando perfil em cache')
        return cached.data
      }

      console.log('🔍 Criando perfil para usuário:', userId)
      
      // Obter dados do usuário do Supabase Auth
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && user.id === userId) {
        // Sempre criar um perfil básico - não depender da tabela user_profiles por enquanto
        const basicProfile: UserWithPermissions = {
          id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          role: 'admin' as const, // Admin por padrão para funcionamento completo
          department: null,
          avatar_url: user.user_metadata?.avatar_url || null,
          is_active: true,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: user.id,
          last_login_at: new Date().toISOString(),
          permissions: {}
        }
        
        console.log('✅ Perfil criado:', basicProfile.display_name, basicProfile.role)
        profileCache.set(userId, { data: basicProfile, timestamp: Date.now() })
        return basicProfile
      }

      console.warn('⚠️ Usuário não encontrado')
      return null
    } catch (error) {
      console.error('❌ Erro ao criar perfil:', error)
      return null
    }
  }, [supabase])

  // Inicialização da autenticação
  useEffect(() => {
    mounted.current = true

    const initAuth = async () => {
      try {
        console.log('🔄 Inicializando autenticação...')
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!mounted.current) return
        
        console.log('👤 Usuário:', user ? user.email : 'Nenhum')
        setUser(user)
        
        if (user) {
          const profile = await fetchUserProfile(user.id)
          if (mounted.current) {
            setUserProfile(profile)
            
            // Definir UI permissions baseado no role
            if (profile?.role) {
              const uiPerms = getDefaultUIPermissionsByRole(profile.role)
              setUIPermissions(uiPerms)
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro na inicialização:', error)
      } finally {
        if (mounted.current) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Estado de auth mudou:', event)
      
      if (!mounted.current) return

      const newUser = session?.user ?? null
      setUser(newUser)
      
      if (newUser) {
        const profile = await fetchUserProfile(newUser.id)
        if (mounted.current) {
          setUserProfile(profile)
          
          if (profile?.role) {
            const uiPerms = getDefaultUIPermissionsByRole(profile.role)
            setUIPermissions(uiPerms)
          }
        }
      } else {
        setUserProfile(null)
        setUIPermissions({})
        profileCache.clear()
      }
    })

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  // ==================== FUNÇÕES DE PERMISSÃO ====================
  const role = userProfile?.role || null

  const hasPermission = useCallback((resource: Resource, action: Action): boolean => {
    if (!role) return false
    if (role === 'admin') return true
    
    const permissionKey = `${resource}_${action}`
    const rolePermissions = DEFAULT_PERMISSIONS[role]
    
    return rolePermissions?.[permissionKey] ?? false
  }, [role])

  const hasAnyPermission = useCallback((permissions: Array<{ resource: Resource; action: Action }>): boolean => {
    return permissions.some(({ resource, action }) => hasPermission(resource, action))
  }, [hasPermission])

  const canAccess = useCallback((resource: Resource): boolean => {
    return hasPermission(resource, ACTIONS.READ)
  }, [hasPermission])

  const canModify = useCallback((resource: Resource): boolean => {
    return hasAnyPermission([
      { resource, action: ACTIONS.CREATE },
      { resource, action: ACTIONS.UPDATE },
      { resource, action: ACTIONS.DELETE }
    ])
  }, [hasAnyPermission])

  const canDelete = useCallback((resource: Resource): boolean => {
    return hasPermission(resource, ACTIONS.DELETE)
  }, [hasPermission])

  // Role helpers
  const isAdmin = useCallback(() => role === 'admin', [role])
  const isManager = useCallback(() => role === 'manager', [role])
  const isViewer = useCallback(() => role === 'viewer', [role])

  // Specific checks
  const canManageUsers = useCallback(() => hasPermission(RESOURCES.USERS, ACTIONS.MANAGE), [hasPermission])
  const canExportData = useCallback(() => hasAnyPermission([
    { resource: RESOURCES.REPORTS, action: ACTIONS.EXPORT },
    { resource: RESOURCES.AUDIT, action: ACTIONS.EXPORT }
  ]), [hasAnyPermission])

  // UI Permission helpers
  const isUIVisible = useCallback((elementKey: string): boolean => {
    return uiPermissions[elementKey]?.visible ?? false
  }, [uiPermissions])

  const isUIEnabled = useCallback((elementKey: string): boolean => {
    return uiPermissions[elementKey]?.enabled ?? false
  }, [uiPermissions])

  const checkUIPermissions = useCallback((elementKeys: string[], type: 'visible' | 'enabled' = 'visible'): Record<string, boolean> => {
    const result: Record<string, boolean> = {}
    elementKeys.forEach(key => {
      result[key] = uiPermissions[key]?.[type] ?? false
    })
    return result
  }, [uiPermissions])

  const refreshProfile = useCallback(async () => {
    if (user) {
      profileCache.delete(user.id) // Limpar cache
      const profile = await fetchUserProfile(user.id)
      setUserProfile(profile)
      
      if (profile?.role) {
        const uiPerms = getDefaultUIPermissionsByRole(profile.role)
        setUIPermissions(uiPerms)
      }
    }
  }, [user, fetchUserProfile])

  const refetchUIPermissions = useCallback(async () => {
    if (userProfile?.role) {
      setUILoading(true)
      const uiPerms = getDefaultUIPermissionsByRole(userProfile.role)
      setUIPermissions(uiPerms)
      setUILoading(false)
    }
  }, [userProfile?.role])

  const contextValue = useMemo(() => ({
    // Auth básico
    user,
    userProfile,
    loading,
    refreshProfile,
    isAuthenticated: !!user,
    role,
    permissions: userProfile?.permissions || {},
    
    // Resource permissions
    hasPermission,
    hasAnyPermission,
    canAccess,
    canModify,
    canDelete,
    
    // Role helpers
    isAdmin,
    isManager,
    isViewer,
    
    // Specific checks
    canManageUsers,
    canExportData,
    
    // UI Permissions
    uiPermissions,
    uiLoading,
    isUIVisible,
    isUIEnabled,
    checkUIPermissions,
    refetchUIPermissions
  }), [
    user,
    userProfile,
    loading,
    refreshProfile,
    role,
    hasPermission,
    hasAnyPermission,
    canAccess,
    canModify,
    canDelete,
    isAdmin,
    isManager,
    isViewer,
    canManageUsers,
    canExportData,
    uiPermissions,
    uiLoading,
    isUIVisible,
    isUIEnabled,
    checkUIPermissions,
    refetchUIPermissions
  ])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  
  return context
}

// Hook para compatibilidade com componentes existentes
export function usePermissions() {
  const auth = useAuth()
  return {
    role: auth.role,
    hasPermission: auth.hasPermission,
    hasAnyPermission: auth.hasAnyPermission,
    canAccess: auth.canAccess,
    canModify: auth.canModify,
    canDelete: auth.canDelete,
    isAdmin: auth.isAdmin,
    isManager: auth.isManager,
    isViewer: auth.isViewer,
    canManageUsers: auth.canManageUsers,
    canExportData: auth.canExportData
  }
}

// Hook para UI permissions
export function useUIPermissions() {
  const auth = useAuth()
  return {
    uiPermissions: auth.uiPermissions,
    uiLoading: auth.uiLoading,
    isUIVisible: auth.isUIVisible,
    isUIEnabled: auth.isUIEnabled,
    checkUIPermissions: auth.checkUIPermissions,
    refetchUIPermissions: auth.refetchUIPermissions
  }
}