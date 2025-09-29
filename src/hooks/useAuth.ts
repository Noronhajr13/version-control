'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { UserWithPermissions } from '@/src/lib/types/database'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserWithPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchUserProfile = async (userId: string) => {
    try {
      // Primeiro tentar a função RPC
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_with_permissions', { user_id_param: userId })
        .single()

      if (!rpcError && rpcData) {
        return rpcData as UserWithPermissions
      }

      console.warn('RPC failed, trying direct query:', rpcError?.message)

      // Se RPC falhou, tentar query direta
      const { data: directData, error: directError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!directError && directData) {
        return {
          ...directData,
          permissions: {}
        } as UserWithPermissions
      }

      console.error('Both methods failed:', { rpcError, directError })
      return null
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      return null
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const profile = await fetchUserProfile(user.id)
        setUserProfile(profile)
        
        // Update last login
        if (profile) {
          await supabase
            .from('user_profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', user.id)
        }
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id)
      setUserProfile(profile)
    }
  }

  return { 
    user, 
    userProfile, 
    loading,
    refreshProfile,
    isAuthenticated: !!user,
    role: userProfile?.role || null,
    permissions: userProfile?.permissions || {}
  }
}
