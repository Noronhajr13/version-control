'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { Sidebar } from '@/src/components/layout/Sidebar'
import { SidebarFallback } from '@/src/components/layout/SidebarFallback'
import { Header } from '@/src/components/layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [useFallback, setUseFallback] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth error:', error)
          setIsAuthenticated(false)
          return
        }

        if (!session) {
          setIsAuthenticated(false)
          router.push('/auth/login')
          return
        }

        setIsAuthenticated(true)

        // Testar se o sistema de roles está funcionando
        try {
          const { data, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError) {
            console.warn('Sistema de roles não disponível, usando fallback:', profileError.message)
            setUseFallback(true)
          }
        } catch (e) {
          console.warn('Erro ao verificar perfil, usando fallback:', e)
          setUseFallback(true)
        }
      } catch (error) {
        console.error('Erro na verificação de auth:', error)
        setIsAuthenticated(false)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false)
        router.push('/auth/login')
      } else {
        setIsAuthenticated(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (isAuthenticated === false) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Redirecionando...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {useFallback ? <SidebarFallback /> : <Sidebar />}
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}