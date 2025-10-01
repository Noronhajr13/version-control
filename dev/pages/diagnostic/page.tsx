'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DatabaseDiagnostic() {
  const [results, setResults] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()

  const runDiagnostic = async () => {
    setLoading(true)
    let output = '=== DIAGNÓSTICO DO BANCO ===\n\n'
    
    try {
      // Teste 1: Verificar conexão
      output += '1. Testando conexão com Supabase...\n'
      const { data: connectionTest, error: connectionError } = await supabase
        .from('user_profiles')
        .select('count(*)')
        .limit(1)
      
      if (connectionError) {
        output += `❌ Erro de conexão: ${connectionError.message}\n\n`
      } else {
        output += `✅ Conexão OK\n\n`
      }

      // Teste 2: Verificar usuários de auth
      output += '2. Verificando usuários de auth...\n'
      const { data: session } = await supabase.auth.getSession()
      if (session.session) {
        output += `✅ Sessão ativa: ${session.session.user.email}\n`
      } else {
        output += `❌ Nenhuma sessão ativa\n`
      }

      // Teste 3: Verificar tabela user_profiles
      output += '\n3. Verificando tabela user_profiles...\n'
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(5)
      
      if (profilesError) {
        output += `❌ Erro ao acessar user_profiles: ${profilesError.message}\n`
      } else {
        output += `✅ Tabela user_profiles acessível\n`
        output += `📊 Encontrados ${profiles?.length || 0} perfis\n`
        if (profiles && profiles.length > 0) {
          output += `📝 Perfis encontrados:\n`
          profiles.forEach(profile => {
            output += `   - ${profile.email} (${profile.role})\n`
          })
        }
      }

      // Teste 4: Verificar outras tabelas
      output += '\n4. Verificando outras tabelas...\n'
      const tables = ['modules', 'clients', 'versions']
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('count(*)')
            .limit(1)
          
          if (error) {
            output += `❌ Tabela ${table}: ${error.message}\n`
          } else {
            output += `✅ Tabela ${table}: OK\n`
          }
        } catch (e) {
          output += `❌ Tabela ${table}: Erro geral\n`
        }
      }

      // Teste 5: Verificar variáveis de ambiente
      output += '\n5. Verificando configuração...\n'
      output += `🔗 URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'NÃO DEFINIDA'}\n`
      output += `🔑 Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA'}\n`

    } catch (error) {
      output += `\n❌ ERRO GERAL: ${error}\n`
    }
    
    setResults(output)
    setLoading(false)
  }

  const createTestUser = async () => {
    setLoading(true)
    let output = '=== CRIANDO USUÁRIO TESTE ===\n\n'
    
    try {
      // Primeiro, tentar criar o usuário
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'admin@test.com',
        password: '123456'
      })
      
      if (signUpError) {
        output += `❌ Erro ao criar usuário: ${signUpError.message}\n`
      } else {
        output += `✅ Usuário criado: ${signUpData.user?.email}\n`
        
        if (signUpData.user) {
          // Tentar criar perfil
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: signUpData.user.id,
              email: signUpData.user.email,
              display_name: 'Admin Test',
              role: 'admin',
              is_active: true
            })
            .select()
            .single()
          
          if (profileError) {
            output += `❌ Erro ao criar perfil: ${profileError.message}\n`
          } else {
            output += `✅ Perfil criado com sucesso\n`
          }
        }
      }
    } catch (error) {
      output += `❌ ERRO GERAL: ${error}\n`
    }
    
    setResults(output)
    setLoading(false)
  }

  useEffect(() => {
    runDiagnostic()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Diagnóstico do Sistema</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={runDiagnostic}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Executando...' : 'Executar Diagnóstico'}
            </button>
            
            <button
              onClick={createTestUser}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Usuário Teste'}
            </button>
          </div>
          
          {results && (
            <div className="bg-gray-100 rounded p-4">
              <pre className="text-sm whitespace-pre-wrap">{results}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}