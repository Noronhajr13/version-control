'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface SimpleAuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined)

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true

    // Função para inicializar autenticação
    const initAuth = async () => {
      try {
        console.log('🔄 [SimpleAuth] Inicializando...')
        const { data: { user } } = await supabase.auth.getUser()
        
        if (mounted.current) {
          console.log('👤 [SimpleAuth] Usuário:', user ? `${user.email}` : 'Nenhum')
          setUser(user)
          setLoading(false)
        }
      } catch (error) {
        console.error('❌ [SimpleAuth] Erro:', error)
        if (mounted.current) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 [SimpleAuth] Estado mudou:', event)
      if (mounted.current) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, []) // SEM DEPENDÊNCIAS para evitar loops

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <SimpleAuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </SimpleAuthContext.Provider>
  )
}

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext)
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider')
  }
  return context
}