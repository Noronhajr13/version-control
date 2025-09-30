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
const pendingRequests = new Map<string, Promise<UserWithPermissions | null>>()
const lastLoginUpdates = new Set<string>()

// ==================== PROVIDER ====================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserWithPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [uiPermissions, setUIPermissions] = useState<UIPermissions>({})
  const [uiLoading, setUILoading] = useState(true)
  
  const supabase = useMemo(() => createClient(), [])
  const isMountedRef = useRef(true)
  const initialLoadRef = useRef(false)

  const fetchUserProfile = async (userId: string, forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const cached = profileCache.get(userId)
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log('📦 Cache hit:', userId)
          return cached.data
        }
      }

      if (pendingRequests.has(userId)) {
        console.log('⏳ Aguardando requisição:', userId)
        return await pendingRequests.get(userId)!
      }

      console.log('🔍 Buscando perfil:', userId)
      
      const fetchPromise = performActualFetch(userId)
      pendingRequests.set(userId, fetchPromise)
      
      try {
        const result = await fetchPromise
        return result
      } finally {
        pendingRequests.delete(userId)
      }
    } catch (error) {
      console.error('❌ Erro ao buscar perfil:', error)
      pendingRequests.delete(userId)
      return null
    }
  }

  const performActualFetch = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        const profile = {
          ...data,
          permissions: data.permissions || {}
        } as UserWithPermissions
        
        profileCache.set(userId, { data: profile, timestamp: Date.now() })
        updateLastLoginOnce(userId)
        
        return profile
      }

      console.warn('⚠️ Criando perfil básico:', error?.message)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.id === userId) {
        const basicProfile: UserWithPermissions = {
          id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          role: 'viewer' as const,
          department: null,
          avatar_url: user.user_metadata?.avatar_url || null,
          is_active: true,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: user.id,
          last_login_at: new Date().toISOString(),
          permissions: {}
        }
        
        profileCache.set(userId, { data: basicProfile, timestamp: Date.now() })
        return basicProfile
      }

      return null
    } catch (error) {
      console.error('❌ Erro na requisição:', error)
      return null
    }
  }

  const updateLastLoginOnce = (userId: string) => {
    if (!lastLoginUpdates.has(userId)) {
      lastLoginUpdates.add(userId)
      
      setTimeout(async () => {
        try {
          await supabase
            .from('user_profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', userId)
          console.log('✅ Last login atualizado')
        } catch (error) {
          console.error('❌ Erro ao atualizar last_login:', error)
        }
      }, 2000)
    }
  }

  const fetchUIPermissions = useCallback(async () => {
    if (!userProfile?.id || !userProfile?.role) {
      setUILoading(false)
      return
    }

    try {
      setUILoading(true)
      const defaultPermissions = getDefaultUIPermissionsByRole(userProfile.role)
      setUIPermissions(defaultPermissions)
    } catch (error) {
      console.error('Error fetching UI permissions:', error)
      setUIPermissions(getDefaultUIPermissionsByRole(userProfile.role || 'viewer'))
    } finally {
      setUILoading(false)
    }
  }, [userProfile?.id, userProfile?.role])

  useEffect(() => {
    isMountedRef.current = true
    
    if (initialLoadRef.current) return
    initialLoadRef.current = true

    const initAuth = async () => {
      try {
        console.log('🔄 Inicializando auth...')
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!isMountedRef.current) return
        
        console.log('👤 Usuário encontrado:', !!user)
        setUser(user)
        
        if (user) {
          console.log('📝 Buscando perfil do usuário...')
          const profile = await fetchUserProfile(user.id)
          if (isMountedRef.current) {
            setUserProfile(profile)
            console.log('✅ Perfil carregado:', !!profile)
          }
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar auth:', error)
      } finally {
        if (isMountedRef.current) {
          console.log('🏁 Finalizando loading...')
          setLoading(false)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event)
      
      if (!isMountedRef.current) return

      const newUser = session?.user ?? null
      
      setUser(prevUser => {
        if (prevUser?.id === newUser?.id) return prevUser
        return newUser
      })
      
      if (newUser) {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          const profile = await fetchUserProfile(newUser.id)
          if (isMountedRef.current) {
            setUserProfile(profile)
          }
        }
      } else {
        setUserProfile(null)
        setUIPermissions({})
        profileCache.clear()
        lastLoginUpdates.clear()
      }
    })

    return () => {
      isMountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  // Fetch UI permissions when profile changes
  useEffect(() => {
    if (userProfile?.id) {
      fetchUIPermissions()
    }
  }, [userProfile?.id, fetchUIPermissions])

  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id, true)
      setUserProfile(profile)
    }
  }

  // ==================== PERMISSION FUNCTIONS ====================
  const role = userProfile?.role || null

  const hasPermission = (resource: Resource, action: Action): boolean => {
    if (!role) return false
    if (role === 'admin') return true
    
    const permissionKey = `${resource}_${action}`
    const rolePermissions = DEFAULT_PERMISSIONS[role]
    
    return rolePermissions?.[permissionKey] ?? false
  }

  const hasAnyPermission = (permissions: Array<{ resource: Resource; action: Action }>): boolean => {
    return permissions.some(({ resource, action }) => hasPermission(resource, action))
  }

  const canAccess = (resource: Resource): boolean => {
    return hasPermission(resource, ACTIONS.READ)
  }

  const canModify = (resource: Resource): boolean => {
    return hasAnyPermission([
      { resource, action: ACTIONS.CREATE },
      { resource, action: ACTIONS.UPDATE },
      { resource, action: ACTIONS.DELETE }
    ])
  }

  const canDelete = (resource: Resource) => hasPermission(resource, ACTIONS.DELETE)

  const isAdmin = () => role === 'admin'
  const isManager = () => role === 'manager' || isAdmin()
  const isViewer = () => role === 'viewer'

  const canManageUsers = () => hasPermission(RESOURCES.USERS, ACTIONS.MANAGE)
  const canExportData = () => {
    return hasAnyPermission([
      { resource: RESOURCES.AUDIT, action: ACTIONS.EXPORT },
      { resource: RESOURCES.REPORTS, action: ACTIONS.EXPORT }
    ])
  }

  // ==================== UI PERMISSION FUNCTIONS ====================
  const isUIVisible = (elementKey: string): boolean => {
    if (!userProfile) return false
    if (role === 'admin') return true
    
    if (uiPermissions[elementKey]) {
      return uiPermissions[elementKey].visible
    }
    
    return getDefaultUIPermissionForElement(role || '', elementKey, 'visible')
  }

  const isUIEnabled = (elementKey: string): boolean => {
    if (!userProfile) return false
    if (role === 'admin') return true
    
    if (!isUIVisible(elementKey)) return false
    
    if (uiPermissions[elementKey]) {
      return uiPermissions[elementKey].enabled
    }
    
    return getDefaultUIPermissionForElement(role || '', elementKey, 'enabled')
  }

  const checkUIPermissions = (elementKeys: string[], type: 'visible' | 'enabled' = 'visible') => {
    return elementKeys.reduce((acc, key) => {
      acc[key] = type === 'visible' ? isUIVisible(key) : isUIEnabled(key)
      return acc
    }, {} as Record<string, boolean>)
  }

  // ==================== MEMOIZED VALUE ====================
  const value = useMemo(() => ({
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
    refetchUIPermissions: fetchUIPermissions
  }), [user, userProfile, loading, uiPermissions, uiLoading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ==================== HOOKS ====================

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  
  return context
}

export function usePermissions() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('usePermissions deve ser usado dentro de um AuthProvider')
  }
  
  return {
    role: context.role,
    userProfile: context.userProfile,
    hasPermission: context.hasPermission,
    hasAnyPermission: context.hasAnyPermission,
    canAccess: context.canAccess,
    canModify: context.canModify,
    canDelete: context.canDelete,
    isAdmin: context.isAdmin,
    isManager: context.isManager,
    isViewer: context.isViewer,
    canManageUsers: context.canManageUsers,
    canExportData: context.canExportData,
    RESOURCES,
    ACTIONS
  }
}

export function useUIPermissions() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useUIPermissions deve ser usado dentro de um AuthProvider')
  }
  
  return {
    permissions: context.uiPermissions,
    loading: context.uiLoading,
    isVisible: context.isUIVisible,
    isEnabled: context.isUIEnabled,
    checkPermissions: context.checkUIPermissions,
    refetch: context.refetchUIPermissions
  }
}