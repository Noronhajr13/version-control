'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { ValidatedInput } from '@/components/ui/ValidatedInput'
import { ErrorManager } from '@/lib/utils/errorHandler'
import { moduleSchema } from '@/lib/validations/schemas'

export default function NewModulePage() {
  const [formData, setFormData] = useState({
    name: ''
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleValidationChange = (field: string, isValid: boolean, error?: string) => {
    setValidationErrors(prev => ({
      ...prev,
      [field]: error || ''
    }))
  }

  const validateForm = (): boolean => {
    try {
      moduleSchema.parse(formData)
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

    const loadingToast = ErrorManager.showLoading('Criando módulo...')
    setIsLoading(true)

    try {
      const { error } = await (supabase
        .from('modules') as unknown as {
          insert: (data: { name: string }[]) => Promise<{ error: Error | null }>
        })
        .insert([{ name: formData.name }])

      if (error) {
        throw error
      }

      ErrorManager.showSuccessMessage('create', 'Módulo')
      
      // Invalidar cache do React Query para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      
      router.push('/dashboard/modules')
    } catch (error) {
      ErrorManager.handleGenericError(error)
    } finally {
      ErrorManager.dismissLoading(loadingToast)
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Novo Módulo
      </h1>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 space-y-6">
          <ValidatedInput
            id="name"
            label="Nome do Módulo"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            validation={{
              required: true,
              minLength: 2,
              maxLength: 100,
              pattern: /^[a-zA-Z0-9\s\-_.]+$/
            }}
            onValidationChange={(isValid, error) => handleValidationChange('name', isValid, error)}
            error={validationErrors.name}
            placeholder="Ex: Módulo Principal"
            helperText="Nome do módulo deve conter apenas letras, números, espaços e os caracteres: - _ ."
            validateOnBlur
            validateOnChange
          />

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
            <Link
              href="/dashboard/modules"
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}