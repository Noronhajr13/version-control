'use client'

import { useAuth } from '@/contexts/AuthContextBasic'
import SimpleSidebar from '@/components/layout/SimpleSidebar'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LogOut, User } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, userProfile, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('🚀 Dashboard Layout - Auth State:', { user: !!user, loading })
    if (!loading && !user) {
      console.log('🔄 Redirecting to login...')
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar Simplificada */}
      <SimpleSidebar className="w-64 flex-shrink-0" />
      
      <div className="flex-1 flex flex-col">
        {/* Header Simplificado */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <User className="w-4 h-4" />
                <span>{userProfile?.display_name || user.email}</span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                  {userProfile?.role}
                </span>
              </div>
              
              <button
                onClick={signOut}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
