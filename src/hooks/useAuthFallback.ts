'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { UserWithPermissions } from '@/src/lib/types/database'

// Cache para evitar múltiplas requisições iguais no fallback
const fallbackProfileCache = new Map<string, { data: UserWithPermissions | null, timestamp: number }>()
const fallbackPendingRequests = new Map<string, Promise<UserWithPermissions | null>>()
const FALLBACK_CACHE_DURATION = 30000 // 30 segundos

export function useAuthFallback() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserWithPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const createFallbackProfile = (user: User): UserWithPermissions => {
    return {
      id: user.id,
      email: user.email || '',
      display_name: user.user_metadata?.name || user.email || '',
      role: user.email === 'noronhajr_13@hotmail.com' ? 'admin' : 'viewer',
      department: null,
      avatar_url: user.user_metadata?.avatar_url || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      last_login_at: new Date().toISOString(),
      permissions: {}
    }
  }

  const fetchUserProfile = async (userId: string) => {
    try {
      // Verificar cache primeiro
      const cached = fallbackProfileCache.get(userId)
      if (cached && Date.now() - cached.timestamp < FALLBACK_CACHE_DURATION) {
        console.log('Using cached fallback profile for user:', userId)
        return cached.data
      }

      // Verificar se já há uma requisição em andamento
      if (fallbackPendingRequests.has(userId)) {
        console.log('Waiting for pending fallback request for user:', userId)
        return await fallbackPendingRequests.get(userId)!
      }

      console.log('Fetching fresh fallback profile for user:', userId)
      
      // Criar promise para esta requisição
      const fetchPromise = performFallbackFetch(userId)
      fallbackPendingRequests.set(userId, fetchPromise)
      
      try {
        const result = await fetchPromise
        return result
      } finally {
        fallbackPendingRequests.delete(userId)
      }
    } catch (error) {
      console.error('Error in fetchUserProfile fallback:', error)
      fallbackPendingRequests.delete(userId)
      return null
    }
  }

  const performFallbackFetch = async (userId: string) => {
    try {
      // Tentar buscar diretamente da tabela user_profiles primeiro
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!profileError && profileData) {
        console.log('Profile found in user_profiles:', profileData)
        const profile = {
          ...profileData,
          permissions: {}
        } as UserWithPermissions
        
        // Armazenar no cache
        fallbackProfileCache.set(userId, { data: profile, timestamp: Date.now() })
        return profile
      }

      console.warn('user_profiles query failed, trying RPC fallback:', profileError?.message)

      // RPC temporariamente desabilitado devido a problemas de API key
      console.warn('RPC get_user_with_permissions desabilitado, usando fallback direto')
      
      // Criar perfil básico usando auth
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.id === userId) {
        console.log('Creating basic profile from auth user')
        const basicProfile = {
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
        } as UserWithPermissions
        
        // Armazenar no cache
        fallbackProfileCache.set(userId, { data: basicProfile, timestamp: Date.now() })
        return basicProfile
      }
      
      return null
    } catch (error) {
      console.warn('Error in fetchUserProfile:', error)
      return null
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          setError(authError.message)
          setLoading(false)
          return
        }

        setUser(user)
        
        if (user) {
          const profile = await fetchUserProfile(user.id)
          
          if (profile) {
            setUserProfile(profile)
          } else {
            // Se não conseguiu buscar do banco, criar perfil fallback
            console.warn('Usando perfil fallback - sistema de roles pode não estar configurado')
            setUserProfile(createFallbackProfile(user))
          }
        } else {
          setUserProfile(null)
        }
        
      } catch (error) {
        console.error('Error in fetchUser:', error)
        setError('Erro ao carregar usuário')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        if (profile) {
          setUserProfile(profile)
        } else {
          setUserProfile(createFallbackProfile(session.user))
        }
      } else {
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id)
      if (profile) {
        setUserProfile(profile)
      } else {
        setUserProfile(createFallbackProfile(user))
      }
    }
  }

  return { 
    user, 
    userProfile, 
    loading,
    error,
    refreshProfile,
    isAuthenticated: !!user,
    role: userProfile?.role || null,
    permissions: userProfile?.permissions || {},
    isFallback: !userProfile || Object.keys(userProfile.permissions).length === 0
  }
}