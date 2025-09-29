'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { UserWithPermissions } from '@/src/lib/types/database'

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
      role: user.email === 'noronhajr_13@hotmail.com' ? 'super_admin' : 'viewer',
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
      // Tentar buscar do banco primeiro
      const { data, error } = await supabase
        .rpc('get_user_with_permissions', { user_id_param: userId })
        .single()

      if (error) {
        console.warn('RPC get_user_with_permissions não disponível:', error.message)
        
        // Tentar buscar diretamente da tabela
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileError) {
          console.warn('Tabela user_profiles não disponível:', profileError.message)
          return null
        }

        return {
          ...profileData,
          permissions: {}
        } as UserWithPermissions
      }

      return data as UserWithPermissions
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