'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SetupPage() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const setupAdmin = async () => {
    setLoading(true)
    setStatus('Iniciando setup...\n')
    
    try {
      // Passo 1: Tentar criar usuário via signup
      setStatus(prev => prev + '\n1. Tentando criar usuário admin...')
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'admin@test.com',
        password: '123456',
        options: {
          data: {
            display_name: 'Administrador',
            role: 'admin'
          }
        }
      })
      
      if (signUpError) {
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
          setStatus(prev => prev + '\n   ✅ Usuário já existe!')
          
          // Tentar fazer login
          setStatus(prev => prev + '\n\n2. Testando login...')
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: 'admin@test.com',
            password: '123456'
          })
          
          if (loginError) {
            setStatus(prev => prev + `\n   ❌ Erro no login: ${loginError.message}`)
          } else {
            setStatus(prev => prev + `\n   ✅ Login funcionando! Usuário: ${loginData.user?.email}`)
            
            // Verificar se tem perfil
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', loginData.user.id)
              .single()
            
            if (profileError) {
              setStatus(prev => prev + `\n\n3. Criando perfil...`)
              // Criar perfil
              const { error: insertError } = await supabase
                .from('user_profiles')
                .insert({
                  id: loginData.user.id,
                  email: loginData.user.email,
                  display_name: 'Administrador',
                  role: 'admin',
                  is_active: true
                })
              
              if (insertError) {
                setStatus(prev => prev + `\n   ❌ Erro ao criar perfil: ${insertError.message}`)
              } else {
                setStatus(prev => prev + `\n   ✅ Perfil criado!`)
              }
            } else {
              setStatus(prev => prev + `\n   ✅ Perfil já existe: ${profile.role}`)
            }
          }
        } else {
          setStatus(prev => prev + `\n   ❌ Erro: ${signUpError.message}`)
        }
      } else {
        setStatus(prev => prev + `\n   ✅ Usuário criado: ${signUpData.user?.email}`)
        
        if (signUpData.user) {
          // Criar perfil
          setStatus(prev => prev + '\n\n2. Criando perfil...')
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: signUpData.user.id,
              email: signUpData.user.email,
              display_name: 'Administrador',
              role: 'admin',
              is_active: true
            })
          
          if (profileError) {
            setStatus(prev => prev + `\n   ❌ Erro ao criar perfil: ${profileError.message}`)
          } else {
            setStatus(prev => prev + '\n   ✅ Perfil criado!')
          }
        }
      }
      
      setStatus(prev => prev + '\n\n🎉 SETUP CONCLUÍDO!')
      setStatus(prev => prev + '\n\nCredenciais para login:')
      setStatus(prev => prev + '\nEmail: admin@test.com')
      setStatus(prev => prev + '\nSenha: 123456')
      
    } catch (error) {
      setStatus(prev => prev + `\n\n❌ ERRO GERAL: ${error}`)
    }
    
    setLoading(false)
  }

  const testLogin = async () => {
    setLoading(true)
    setStatus('Testando login...\n')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: '123456'
      })
      
      if (error) {
        setStatus(prev => prev + `❌ Erro no login: ${error.message}`)
      } else {
        setStatus(prev => prev + `✅ Login bem-sucedido!`)
        setStatus(prev => prev + `\nUsuário: ${data.user.email}`)
        setStatus(prev => prev + `\nID: ${data.user.id}`)
        
        // Buscar perfil
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        if (profileError) {
          setStatus(prev => prev + `\n❌ Erro ao buscar perfil: ${profileError.message}`)
        } else {
          setStatus(prev => prev + `\n✅ Perfil: ${profile.role} - ${profile.display_name}`)
        }
        
        setStatus(prev => prev + '\n\n🎉 TUDO FUNCIONANDO! Pode ir para /auth/login')
      }
    } catch (error) {
      setStatus(prev => prev + `\n❌ ERRO: ${error}`)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Setup do Sistema
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Configure o usuário administrador inicial
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="flex space-x-4">
            <button
              onClick={setupAdmin}
              disabled={loading}
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Configurando...' : 'Configurar Admin'}
            </button>
            
            <button
              onClick={testLogin}
              disabled={loading}
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'Testando...' : 'Testar Login'}
            </button>
          </div>
          
          {status && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md">
              <pre className="text-sm whitespace-pre-wrap text-gray-800">{status}</pre>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <a 
              href="/auth/login"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Ir para página de login →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}