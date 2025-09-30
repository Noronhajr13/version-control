// src/contexts/AuthContextSimple.tsx
'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
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

// ==================== UI PERMISSIONS ====================
interface UIPermissions {
  [elementKey: string]: {
    visible: boolean
    enabled: boolean
  }
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

// ==================== PROVIDER ====================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserWithPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [uiPermissions] = useState<UIPermissions>({})
  
  const supabase = createClient()
  const mounted = useRef(true)

  // Função para criar perfil admin
  const createAdminProfile = (user: User): UserWithPermissions => {
    return {
      id: user.id,
      email: user.email || '',
      display_name: user.email?.split('@')[0] || 'Admin',
      role: 'admin' as const,
      department: null,
      avatar_url: null,
      is_active: true,
      created_at: user.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: user.id,
      last_login_at: new Date().toISOString(),
      permissions: {}
    }
  }

  // Inicialização da autenticação
  useEffect(() => {
    mounted.current = true

    const initAuth = async () => {
      try {
        console.log('🔄 [Simple] Inicializando autenticação...')
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!mounted.current) return
        
        console.log('👤 [Simple] Usuário:', user ? user.email : 'Nenhum')
        setUser(user)
        
        if (user) {
          // SEMPRE criar perfil admin - sem buscar na base de dados
          const profile = createAdminProfile(user)
          setUserProfile(profile)
          console.log('✅ [Simple] Perfil admin criado:', profile.display_name)
        } else {
          setUserProfile(null)
        }
      } catch (error) {
        console.error('❌ [Simple] Erro na inicialização:', error)
      } finally {
        if (mounted.current) {
          console.log('🏁 [Simple] Loading finalizado')
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [Simple] Estado de auth mudou:', event)
      
      if (!mounted.current) return

      const newUser = session?.user ?? null
      setUser(newUser)
      
      if (newUser) {
        const profile = createAdminProfile(newUser)
        setUserProfile(profile)
        console.log('✅ [Simple] Perfil atualizado:', profile.display_name)
      } else {
        setUserProfile(null)
        console.log('❌ [Simple] Usuário deslogado')
      }
      
      setLoading(false)
    })

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, []) // SEM DEPENDÊNCIAS para evitar loops

  // ==================== FUNÇÕES SIMPLES ====================
  const role = userProfile?.role || null

  // Sempre admin = sempre true
  const hasPermission = () => true
  const hasAnyPermission = () => true
  const canAccess = () => true
  const canModify = () => true
  const canDelete = () => true
  const isAdmin = () => true
  const isManager = () => false
  const isViewer = () => false
  const canManageUsers = () => true
  const canExportData = () => true
  const isUIVisible = () => true
  const isUIEnabled = () => true
  const checkUIPermissions = () => ({})
  const refreshProfile = async () => {}
  const refetchUIPermissions = async () => {}

  const contextValue = {
    // Auth básico
    user,
    userProfile,
    loading,
    refreshProfile,
    isAuthenticated: !!user,
    role,
    permissions: {},
    
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
    uiLoading: false,
    isUIVisible,
    isUIEnabled,
    checkUIPermissions,
    refetchUIPermissions
  }

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

// Hook para compatibilidade
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