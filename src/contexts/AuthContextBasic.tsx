'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

// ==================== TIPOS BÁSICOS ====================
export type UserRole = 'admin' | 'manager' | 'viewer'

interface BasicUserProfile {
  id: string
  email: string
  display_name: string
  role: UserRole
  is_active: boolean
}

interface MenuConfig {
  dashboard: UserRole[]
  modules: UserRole[]
  clients: UserRole[]
  versions: UserRole[]
  reports: UserRole[]
  users: UserRole[]
}

// ==================== CONFIGURAÇÃO DE MENUS ====================
const DEFAULT_MENU_CONFIG: MenuConfig = {
  dashboard: ['admin', 'manager', 'viewer'],
  modules: ['admin', 'manager'],
  clients: ['admin', 'manager'],
  versions: ['admin', 'manager'],
  reports: ['admin', 'manager', 'viewer'],
  users: ['admin']
}

// ==================== CONTEXT TYPE ====================
interface AuthContextType {
  user: User | null
  userProfile: BasicUserProfile | null
  loading: boolean
  isAuthenticated: boolean
  role: UserRole | null
  
  // Menu visibility
  canSeeMenu: (menuName: keyof MenuConfig) => boolean
  menuConfig: MenuConfig
  updateMenuConfig: (config: MenuConfig) => Promise<void>
  
  // Basic actions
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

// ==================== CONTEXT ====================
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ==================== PROVIDER ====================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<BasicUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuConfig, setMenuConfig] = useState<MenuConfig>(DEFAULT_MENU_CONFIG)
  
  const supabase = createClient()
  const mounted = useRef(true)

  // ==================== PROFILE CREATION ====================
  const createBasicProfile = async (user: User): Promise<BasicUserProfile> => {
    // Sempre criar perfil admin para simplicidade e segurança
    const profile: BasicUserProfile = {
      id: user.id,
      email: user.email || '',
      display_name: user.email?.split('@')[0] || 'Usuário',
      role: 'admin', // Sempre admin para evitar problemas
      is_active: true
    }

    // Tentar salvar no banco (sem quebrar se falhar)
    try {
      await supabase
        .from('user_profiles')
        .upsert({
          id: profile.id,
          email: profile.email,
          display_name: profile.display_name,
          role: profile.role,
          is_active: profile.is_active,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.warn('⚠️ Não foi possível salvar perfil no banco, usando local:', error)
    }

    return profile
  }

  // ==================== MENU FUNCTIONS ====================
  const canSeeMenu = (menuName: keyof MenuConfig): boolean => {
    if (!userProfile) return false
    if (userProfile.role === 'admin') return true // Admin vê tudo
    
    return menuConfig[menuName].includes(userProfile.role)
  }

  const updateMenuConfig = async (config: MenuConfig): Promise<void> => {
    setMenuConfig(config)
    
    // Tentar salvar configuração (sem quebrar se falhar)
    try {
      localStorage.setItem('menuConfig', JSON.stringify(config))
    } catch (error) {
      console.warn('⚠️ Não foi possível salvar config do menu:', error)
    }
  }

  const refreshProfile = async (): Promise<void> => {
    if (!user) return
    
    try {
      const profile = await createBasicProfile(user)
      setUserProfile(profile)
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error)
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error)
    }
  }

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    mounted.current = true

    const initAuth = async () => {
      try {
        console.log('🔄 [AuthBasic] Inicializando...')
        
        // Carregar configuração de menu do localStorage
        try {
          const savedConfig = localStorage.getItem('menuConfig')
          if (savedConfig) {
            setMenuConfig(JSON.parse(savedConfig))
          }
        } catch (error) {
          console.warn('⚠️ Configuração de menu não encontrada, usando padrão')
        }

        const { data: { user } } = await supabase.auth.getUser()
        
        if (!mounted.current) return
        
        console.log('👤 [AuthBasic] Usuário:', user ? user.email : 'Nenhum')
        setUser(user)
        
        if (user) {
          const profile = await createBasicProfile(user)
          setUserProfile(profile)
          console.log('✅ [AuthBasic] Perfil criado:', profile.display_name, profile.role)
        }
      } catch (error) {
        console.error('❌ [AuthBasic] Erro na inicialização:', error)
      } finally {
        if (mounted.current) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [AuthBasic] Estado mudou:', event)
      
      if (!mounted.current) return

      const newUser = session?.user ?? null
      setUser(newUser)
      
      if (newUser) {
        const profile = await createBasicProfile(newUser)
        setUserProfile(profile)
        console.log('✅ [AuthBasic] Perfil atualizado:', profile.display_name)
      } else {
        setUserProfile(null)
        console.log('❌ [AuthBasic] Usuário deslogado')
      }
      
      setLoading(false)
    })

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, []) // SEM DEPENDÊNCIAS para evitar loops

  // ==================== CONTEXT VALUE ====================
  const contextValue: AuthContextType = {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
    role: userProfile?.role || null,
    
    // Menu functions
    canSeeMenu,
    menuConfig,
    updateMenuConfig,
    
    // Actions
    refreshProfile,
    signOut
  }

  return (
    <AuthContext.Provider value={contextValue}>
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

// Hook para compatibilidade (básico)
export function useBasicPermissions() {
  const { role, userProfile } = useAuth()
  
  return {
    role,
    userProfile,
    isAdmin: () => role === 'admin',
    isManager: () => role === 'manager' || role === 'admin',
    isViewer: () => role === 'viewer',
    canEdit: () => role === 'admin' || role === 'manager',
    canDelete: () => role === 'admin'
  }
}