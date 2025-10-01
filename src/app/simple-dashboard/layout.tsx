'use client'

import { useAuth } from '@/contexts/AuthContextBasic'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SimpleDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('🚀 [SimpleDashboard] Auth State:', { user: !!user, loading })
    
    // Só redireciona se não está carregando E não tem usuário
    if (!loading && !user) {
      console.log('🔄 Redirecionando para simple-login...')
      router.push('/simple-login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando autenticação...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecionando para login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Simples</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Olá, {user.email}
              </span>
              <button
                onClick={signOut}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-3">
            <a href="/simple-dashboard" className="text-blue-600 hover:text-blue-800 font-medium">Dashboard</a>
            <a href="/simple-dashboard/versions" className="text-blue-600 hover:text-blue-800">Versões</a>
            <a href="/simple-dashboard/clients" className="text-blue-600 hover:text-blue-800">Clientes</a>
            <a href="/simple-dashboard/modules" className="text-blue-600 hover:text-blue-800">Módulos</a>
            <a href="/debug-auth" className="text-gray-500 hover:text-gray-700">Debug</a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}