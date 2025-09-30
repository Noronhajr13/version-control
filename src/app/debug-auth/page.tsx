'use client'

import { useAuth } from '@/src/contexts/AuthContext'
import { createClient } from '@/src/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function DebugAuthPage() {
  const { user, loading, userProfile } = useAuth()
  const [supabaseUser, setSupabaseUser] = useState<any>(null)
  const [supabaseLoading, setSupabaseLoading] = useState(true)

  useEffect(() => {
    const getSupabaseUser = async () => {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      console.log('🔍 Supabase direct call:', { user, error })
      setSupabaseUser(user)
      setSupabaseLoading(false)
    }
    getSupabaseUser()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Debug Autenticação</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AuthContext */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">AuthContext</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
              <p><strong>User:</strong> {user ? '✅ Logado' : '❌ Não logado'}</p>
              {user && (
                <>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>ID:</strong> {user.id}</p>
                </>
              )}
              <p><strong>Profile:</strong> {userProfile ? '✅ Carregado' : '❌ Não carregado'}</p>
              {userProfile && (
                <>
                  <p><strong>Role:</strong> {userProfile.role}</p>
                  <p><strong>Display Name:</strong> {userProfile.display_name || 'N/A'}</p>
                </>
              )}
            </div>
          </div>

          {/* Supabase Direct */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Supabase Direto</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {supabaseLoading ? 'true' : 'false'}</p>
              <p><strong>User:</strong> {supabaseUser ? '✅ Logado' : '❌ Não logado'}</p>
              {supabaseUser && (
                <>
                  <p><strong>Email:</strong> {supabaseUser.email}</p>
                  <p><strong>ID:</strong> {supabaseUser.id}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Variáveis de Ambiente</h2>
          <div className="space-y-2">
            <p><strong>SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Definida' : '❌ Não definida'}</p>
            <p><strong>SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Definida' : '❌ Não definida'}</p>
          </div>
        </div>

        <div className="mt-6">
          <a 
            href="/auth/login" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Ir para Login
          </a>
          <a 
            href="/dashboard" 
            className="ml-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Ir para Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}