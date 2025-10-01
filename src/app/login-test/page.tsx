'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginTest() {
  const [email, setEmail] = useState('admin@test.com')
  const [password, setPassword] = useState('123456')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const testLogin = async () => {
    setLoading(true)
    setStatus('Testando login...')
    
    try {
      console.log('Tentando fazer login com:', { email, password })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      console.log('Resultado do login:', { data, error })
      
      if (error) {
        setStatus(`Erro: ${error.message}`)
      } else if (data.user) {
        setStatus(`Sucesso! Usuário logado: ${data.user.email}`)
        
        // Testar buscar perfil
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        console.log('Perfil:', { profile, profileError })
        
        if (profileError) {
          setStatus(prev => prev + `\nErro ao buscar perfil: ${profileError.message}`)
        } else {
          setStatus(prev => prev + `\nPerfil encontrado: ${JSON.stringify(profile, null, 2)}`)
        }
      } else {
        setStatus('Login falhou sem erro específico')
      }
    } catch (error) {
      console.error('Erro geral:', error)
      setStatus(`Erro geral: ${error}`)
    }
    
    setLoading(false)
  }

  const testSignUp = async () => {
    setLoading(true)
    setStatus('Criando usuário...')
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })
      
      console.log('Resultado do signup:', { data, error })
      
      if (error) {
        setStatus(`Erro ao criar: ${error.message}`)
      } else {
        setStatus(`Usuário criado! Verifique o email para confirmar`)
      }
    } catch (error) {
      console.error('Erro geral:', error)
      setStatus(`Erro geral: ${error}`)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Teste de Login
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={testLogin}
                disabled={loading}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Testando...' : 'Testar Login'}
              </button>
              
              <button
                onClick={testSignUp}
                disabled={loading}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Criar Usuário'}
              </button>
            </div>

            {status && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <pre className="text-sm whitespace-pre-wrap">{status}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}