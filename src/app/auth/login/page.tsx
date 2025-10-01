'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ValidatedInput } from '@/components/ui/ValidatedInput'
import { ErrorManager } from '@/lib/utils/errorHandler'
import { authSchema } from '@/lib/validations/schemas'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleValidationChange = (field: string, isValid: boolean, error?: string) => {
    setValidationErrors(prev => ({
      ...prev,
      [field]: error || ''
    }))
  }

  const validateForm = (): boolean => {
    try {
      authSchema.parse(formData)
      return true
    } catch (error) {
      if (error instanceof Error) {
        ErrorManager.handleGenericError(error)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar formulário
    if (!validateForm()) {
      return
    }

    // Verificar se há erros de validação
    const hasValidationErrors = Object.values(validationErrors).some(error => error !== '')
    if (hasValidationErrors) {
      ErrorManager.handleAPIError({
        code: 'validation-error',
        message: 'Por favor, corrija os erros no formulário'
      })
      return
    }

    const loadingToast = ErrorManager.showLoading(isSignUp ? 'Criando conta...' : 'Fazendo login...')
    setIsLoading(true)

    try {
      if (isSignUp) {
        // Usar URL do production no Vercel ou localhost em desenvolvimento
        const redirectUrl = process.env.NODE_ENV === 'production' 
          ? 'https://version-control-op0syekdj-noronhas-projects-67ae95f6.vercel.app/auth/callback'
          : `${window.location.origin}/auth/callback`
          
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        })
        
        if (error) throw error
        
        ErrorManager.showSuccessMessage('create', 'Conta criada! Verifique seu email para confirmar')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        
        if (error) throw error
        
        ErrorManager.showSuccessMessage('login', 'Login realizado com sucesso!')
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      ErrorManager.handleGenericError(error)
    } finally {
      ErrorManager.dismissLoading(loadingToast)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isSignUp ? 'Criar conta' : 'Entrar no sistema'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Sistema de Controle de Versões
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <ValidatedInput
              id="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              validation={{
                required: true
              }}
              onValidationChange={(isValid, error) => handleValidationChange('email', isValid, error)}
              error={validationErrors.email}
              placeholder="seu@email.com"
              autoComplete="email"
              validateOnBlur
              validateOnChange
            />
            
            <ValidatedInput
              id="password"
              label="Senha"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              validation={{
                required: true,
                minLength: 6
              }}
              onValidationChange={(isValid, error) => handleValidationChange('password', isValid, error)}
              error={validationErrors.password}
              placeholder="••••••••"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              showPasswordToggle
              validateOnBlur
              validateOnChange
              helperText={isSignUp ? "Senha deve ter pelo menos 6 caracteres" : undefined}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processando...' : (isSignUp ? 'Criar conta' : 'Entrar')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}