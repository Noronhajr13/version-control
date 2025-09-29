'use client'

import { useAuth } from '@/src/hooks/useAuth'
import { useAuthFallback } from '@/src/hooks/useAuthFallback'
import { createClient } from '@/src/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Card } from '@/src/components/ui/Card'

export default function DiagnosticPage() {
  const auth = useAuth()
  const authFallback = useAuthFallback()
  const [dbCheck, setDbCheck] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        let checkResults: any = {}

        // 1. Testar conexão básica
        try {
          const { data: testData, error: testError } = await supabase
            .from('modules')
            .select('count')
            .limit(1)
          
          checkResults.connectionWorks = !testError
          checkResults.connectionError = testError?.message
        } catch (e) {
          checkResults.connectionWorks = false
          checkResults.connectionError = String(e)
        }

        // 2. Testar se a tabela user_profiles existe
        try {
          const { data: profileTest, error: profileError } = await supabase
            .from('user_profiles')
            .select('count')
            .limit(1)

          checkResults.profileTableExists = !profileError
          checkResults.profileTableError = profileError?.message
        } catch (e) {
          checkResults.profileTableExists = false
          checkResults.profileTableError = String(e)
        }

        // 3. Testar se o perfil do usuário existe
        if (auth.user) {
          try {
            const { data: userData, error: userError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', auth.user.id)
              .single()

            checkResults.userProfileExists = !userError && !!userData
            checkResults.userProfileData = userData
            checkResults.userProfileError = userError?.message
          } catch (e) {
            checkResults.userProfileExists = false
            checkResults.userProfileError = String(e)
          }

          // 4. Verificar se o usuário existe no auth.users (via RPC)
          try {
            const { data: authData, error: authError } = await supabase
              .rpc('get_user_with_permissions', { user_id_param: auth.user.id })

            checkResults.rpcWorks = !authError
            checkResults.rpcData = authData
            checkResults.rpcError = authError?.message
          } catch (e) {
            checkResults.rpcWorks = false
            checkResults.rpcError = String(e)
          }
        }

        setDbCheck(checkResults)
      } catch (error) {
        console.error('Error checking database:', error)
        setDbCheck({ error: String(error) })
      } finally {
        setLoading(false)
      }
    }

    if (auth.user) {
      checkDatabase()
    } else {
      setLoading(false)
    }
  }, [auth.user, supabase])

  if (loading) {
    return <div className="p-8">Carregando diagnóstico...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">🔍 Diagnóstico do Sistema de Roles</h1>
      
      {/* Status do useAuth padrão */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">📊 Hook useAuth Padrão</h2>
        <div className="space-y-2 text-sm">
          <div>Loading: {auth.loading ? '✅ Carregando' : '❌ Carregado'}</div>
          <div>User: {auth.user ? `✅ ${auth.user.email}` : '❌ Não logado'}</div>
          <div>Profile: {auth.userProfile ? `✅ ${auth.userProfile.role}` : '❌ Sem profile'}</div>
          <div>Role: {auth.role || '❌ Sem role'}</div>
          <div>Permissions: {Object.keys(auth.permissions).length} permissões</div>
        </div>
      </Card>

      {/* Status do useAuthFallback */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">🔄 Hook useAuth Fallback</h2>
        <div className="space-y-2 text-sm">
          <div>Loading: {authFallback.loading ? '✅ Carregando' : '❌ Carregado'}</div>
          <div>User: {authFallback.user ? `✅ ${authFallback.user.email}` : '❌ Não logado'}</div>
          <div>Profile: {authFallback.userProfile ? `✅ ${authFallback.userProfile.role}` : '❌ Sem profile'}</div>
          <div>Role: {authFallback.role || '❌ Sem role'}</div>
          <div>Is Fallback: {authFallback.isFallback ? '⚠️ Usando fallback' : '✅ Dados do banco'}</div>
          <div>Error: {authFallback.error || '✅ Sem erros'}</div>
        </div>
      </Card>

      {/* Status do Banco */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">🗄️ Status do Banco de Dados</h2>
        {dbCheck ? (
          <div className="space-y-2 text-sm">
            <div>Conexão Supabase: {dbCheck.connectionWorks ? '✅ OK' : '❌ Falhou'}</div>
            {dbCheck.connectionError && <div className="text-red-600">Erro conexão: {dbCheck.connectionError}</div>}
            
            <div>Tabela user_profiles: {dbCheck.profileTableExists ? '✅ Existe' : '❌ Não existe'}</div>
            {dbCheck.profileTableError && <div className="text-red-600">Erro tabela: {dbCheck.profileTableError}</div>}
            
            <div>Seu profile existe: {dbCheck.userProfileExists ? '✅ Sim' : '❌ Não'}</div>
            {dbCheck.userProfileError && <div className="text-red-600">Erro profile: {dbCheck.userProfileError}</div>}
            {dbCheck.userProfileData && (
              <div className="bg-green-50 p-2 rounded text-xs">
                Profile: {JSON.stringify(dbCheck.userProfileData, null, 2)}
              </div>
            )}
            
            <div>Função RPC: {dbCheck.rpcWorks ? '✅ Funciona' : '❌ Não funciona'}</div>
            {dbCheck.rpcError && <div className="text-red-600">Erro RPC: {dbCheck.rpcError}</div>}
            
            {dbCheck.error && <div className="text-red-600">Erro geral: {dbCheck.error}</div>}
          </div>
        ) : (
          <div>Verificação não disponível</div>
        )}
      </Card>

      {/* Ações de Correção */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">🛠️ Ações de Correção</h2>
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🔄 Recarregar Página
          </button>
          
          <button
            onClick={() => authFallback.refreshProfile()}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-2"
          >
            🔄 Atualizar Profile
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Se "Profile existe" for ❌, execute o SQL no Supabase novamente.</p>
          <p>Se "RPC funciona" for ❌, as funções não foram criadas corretamente.</p>
          <p>Se "Tabelas existem" for ❌, o SQL principal não foi executado.</p>
        </div>
      </Card>
    </div>
  )
}