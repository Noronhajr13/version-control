'use client'

import { useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'

export default function SimpleLoginPage() {
  const [email, setEmail] = useState('admin@test.com')
  const [password, setPassword] = useState('123456789')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()
      
      console.log('🔄 Tentando fazer login...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Erro no login:', error)
        setMessage(`Erro: ${error.message}`)
        return
      }

      console.log('✅ Login bem-sucedido!', data)
      setMessage('✅ Login realizado com sucesso! Redirecionando...')
      
      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)

    } catch (error) {
      console.error('❌ Erro inesperado:', error)
      setMessage(`Erro inesperado: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const createUser = async () => {
    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()
      
      console.log('🔄 Criando usuário...')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        console.error('❌ Erro ao criar usuário:', error)
        setMessage(`Erro: ${error.message}`)
        return
      }

      console.log('✅ Usuário criado!', data)
      
      if (data.user) {
        // Tentar criar perfil
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: email,
            display_name: 'Admin Teste',
            role: 'admin',
            is_active: true
          })
          
        if (profileError) {
          console.warn('⚠️ Erro ao criar perfil:', profileError)
          setMessage(`Usuário criado, mas erro no perfil: ${profileError.message}`)
        } else {
          setMessage('✅ Usuário e perfil criados com sucesso!')
        }
      }

    } catch (error) {
      console.error('❌ Erro inesperado:', error)
      setMessage(`Erro inesperado: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Login Simples</h1>
          <p className="mt-2 text-gray-600">Sistema de Controle de Versões</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processando...' : 'Fazer Login'}
            </button>

            <button
              type="button"
              onClick={createUser}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando...' : 'Criar Usuário de Teste'}
            </button>
          </div>
        </form>

        {message && (
          <div className={`p-4 rounded-md ${
            message.startsWith('✅') 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="text-center">
          <a href="/debug-auth" className="text-blue-600 hover:text-blue-800 text-sm">
            Ver Debug da Autenticação
          </a>
        </div>
      </div>
    </div>
  )
}