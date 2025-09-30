'use client'

import { useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'

export default function CreateTestUser() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const createTestUser = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const supabase = createClient()
      
      // Criar usuário de teste
      const { data, error } = await supabase.auth.signUp({
        email: 'admin@test.com',
        password: '123456789',
        options: {
          data: {
            display_name: 'Admin Teste'
          }
        }
      })
      
      if (error) {
        setMessage(`Erro: ${error.message}`)
        return
      }
      
      if (data.user) {
        // Criar perfil do usuário
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: 'admin@test.com',
            display_name: 'Admin Teste',
            role: 'admin',
            is_active: true
          })
          
        if (profileError) {
          setMessage(`Erro ao criar perfil: ${profileError.message}`)
          return
        }
        
        setMessage('✅ Usuário de teste criado com sucesso! Email: admin@test.com | Senha: 123456789')
      }
      
    } catch (error) {
      setMessage(`Erro: ${error}`)
    } finally {
      setLoading(false)
    }
  }
  
  const loginTestUser = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: '123456789'
      })
      
      if (error) {
        setMessage(`Erro no login: ${error.message}`)
        return
      }
      
      setMessage('✅ Login realizado com sucesso! Redirecionando...')
      
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
      
    } catch (error) {
      setMessage(`Erro: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Criar Usuário de Teste</h1>
        
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <button
            onClick={createTestUser}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Usuário de Teste (admin@test.com)'}
          </button>
          
          <button
            onClick={loginTestUser}
            disabled={loading}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Fazendo login...' : 'Login com Usuário de Teste'}
          </button>
          
          {message && (
            <div className={`p-4 rounded ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}
          
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Credenciais de Teste:</h3>
            <p><strong>Email:</strong> admin@test.com</p>
            <p><strong>Senha:</strong> 123456789</p>
            <p><strong>Role:</strong> admin</p>
          </div>
        </div>
      </div>
    </div>
  )
}