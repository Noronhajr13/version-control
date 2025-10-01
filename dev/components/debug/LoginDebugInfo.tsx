'use client'

import { useAuth } from '@/contexts/AuthContextBasic'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

// Componente de debug para ajudar a diagnosticar problemas de login
export default function LoginDebugInfo() {
  const { user, loading, userProfile } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [debugInfo, setDebugInfo] = useState<{
    authState: string
    timestamp: number
    redirectAttempts: number
    user?: any
    profile?: any
    currentPath?: string
  }>({
    authState: 'initial',
    timestamp: 0,
    redirectAttempts: 0
  })

  // Garantir que só renderiza no cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const updateDebugInfo = () => {
      setDebugInfo(prev => ({
        ...prev,
        authState: loading ? 'loading' : user ? 'authenticated' : 'unauthenticated',
        timestamp: Date.now(),
        currentPath: window.location.pathname,
        user: user ? {
          id: user.id,
          email: user.email,
          confirmed: user.email_confirmed_at ? 'sim' : 'não'
        } : null,
        profile: userProfile ? {
          name: userProfile.display_name,
          role: userProfile.role,
          active: userProfile.is_active
        } : null
      }))
    }

    updateDebugInfo()
    
    // Log detalhado no console
    console.log('🔍 LOGIN DEBUG INFO:', {
      loading,
      user: user ? { id: user.id, email: user.email } : null,
      profile: userProfile ? 'sim' : 'não',
      currentPath: window.location.pathname,
      timestamp: new Date().toLocaleTimeString()
    })

    // Lógica melhorada de redirecionamento
    if (!loading && user && userProfile && window.location.pathname === '/auth/login') {
      console.log('🚀 Usuário autenticado COM PERFIL, tentando redirecionamento...')
      console.log('   Dados:', { user: user.email, profile: userProfile.display_name, role: userProfile.role })
      
      setDebugInfo(prev => ({ ...prev, redirectAttempts: prev.redirectAttempts + 1 }))
      
      if (debugInfo.redirectAttempts < 3) {
        setTimeout(() => {
          console.log('🔄 Executando redirecionamento para dashboard...')
          window.location.href = '/dashboard'
        }, 1500)
      } else {
        console.log('❌ Muitas tentativas de redirecionamento, parando')
        console.log('⚠️ Possível problema: usuário autenticado mas perfil incompleto')
      }
    } else if (!loading && user && !userProfile && window.location.pathname === '/auth/login') {
      console.log('⚠️ Usuário autenticado MAS SEM PERFIL - isso causa loading infinito!')
      console.log('   User ID:', user.id)
      console.log('   User Email:', user.email)
      console.log('   Profile:', userProfile)
    }
  }, [isClient, loading, user, userProfile, debugInfo.redirectAttempts])

  // Só mostrar em desenvolvimento e após hidratação
  if (process.env.NODE_ENV !== 'development' || !isClient) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h4 className="font-bold text-green-400 mb-2">🔍 DEBUG LOGIN</h4>
      
      <div className="space-y-1">
        <div>
          <span className="text-blue-400">Estado:</span> {debugInfo.authState}
        </div>
        
        <div>
          <span className="text-blue-400">Loading:</span> {loading ? 'SIM' : 'NÃO'}
        </div>
        
        <div>
          <span className="text-blue-400">Tem User:</span> {user ? 'SIM' : 'NÃO'}
        </div>
        
        <div>
          <span className="text-blue-400">Tem Profile:</span> {userProfile ? 'SIM' : 'NÃO'}
        </div>
        
        {debugInfo.user && (
          <div>
            <span className="text-blue-400">Usuário:</span>
            <div className="ml-2 text-xs">
              <div>ID: {debugInfo.user.id.substring(0, 8)}...</div>
              <div>Email: {debugInfo.user.email}</div>
              <div>Confirmado: {debugInfo.user.confirmed}</div>
            </div>
          </div>
        )}

        {debugInfo.profile && (
          <div>
            <span className="text-blue-400">Perfil:</span>
            <div className="ml-2 text-xs">
              <div>Nome: {debugInfo.profile.name}</div>
              <div>Role: {debugInfo.profile.role}</div>
              <div>Ativo: {debugInfo.profile.active ? 'SIM' : 'NÃO'}</div>
            </div>
          </div>
        )}
        
        <div>
          <span className="text-blue-400">Tentativas Redirect:</span> {debugInfo.redirectAttempts}
        </div>
        
        <div>
          <span className="text-blue-400">Página Atual:</span> {debugInfo.currentPath || 'carregando...'}
        </div>
        
        <div className="text-xs text-gray-400 mt-2">
          Atualizado: {new Date(debugInfo.timestamp).toLocaleTimeString()}
        </div>
      </div>
      
      {debugInfo.authState === 'authenticated' && debugInfo.currentPath === '/auth/login' && (
        <div className="mt-2 p-2 bg-red-900 rounded text-xs">
          ⚠️ Usuário autenticado mas ainda na página de login!
          {user && !userProfile && (
            <div className="mt-1 text-yellow-300">
              🔥 PROBLEMA: Sem perfil = Loading infinito!
              <button 
                onClick={() => {
                  console.log('🔧 Forçando logout e refresh...')
                  // Limpar tudo e recarregar
                  localStorage.clear()
                  sessionStorage.clear()
                  window.location.href = '/auth/login'
                }}
                className="mt-1 block w-full bg-yellow-600 hover:bg-yellow-700 text-black px-2 py-1 rounded text-xs font-bold"
              >
                🛠️ CORRIGIR LOGIN
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}