'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/src/lib/types/database'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { ValidatedInput } from '@/src/components/ui/ValidatedInput'
import { ValidatedSelect } from '@/src/components/ui/ValidatedSelect'
import { ErrorManager } from '@/src/lib/utils/errorHandler'
import { clientSchema, BRAZILIAN_STATES } from '@/src/lib/validations/schemas'

const UF_OPTIONS = BRAZILIAN_STATES.map(uf => ({
  value: uf,
  label: uf
}))

export default function NewClientPage() {
  const [formData, setFormData] = useState({
    name: '',
    uf: ''
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
      clientSchema.parse(formData)
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

    const loadingToast = ErrorManager.showLoading('Criando cliente...')
    setIsLoading(true)

    try {
      const { error } = await (supabase
        .from('clients') as unknown as {
          insert: (data: { name: string; uf: string }[]) => Promise<{ error: Error | null }>
        })
        .insert([{ name: formData.name, uf: formData.uf }])

      if (error) {
        throw error
      }

      ErrorManager.showSuccessMessage('create', 'Cliente')
      
      // Invalidar cache do React Query para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      
      router.push('/dashboard/clients')
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
        Novo Cliente
      </h1>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 space-y-6">
          <ValidatedInput
            id="name"
            label="Nome do Cliente"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            validation={{
              required: true,
              minLength: 2,
              maxLength: 200,
              pattern: /^[a-zA-Z0-9\s\-_.&]+$/
            }}
            onValidationChange={(isValid, error) => handleValidationChange('name', isValid, error)}
            error={validationErrors.name}
            placeholder="Ex: Empresa ABC Ltda"
            helperText="Nome da empresa ou pessoa física"
            validateOnBlur
            validateOnChange
          />

          <ValidatedSelect
            id="uf"
            label="UF (Estado)"
            options={UF_OPTIONS}
            value={formData.uf}
            onChange={(value) => setFormData(prev => ({ ...prev, uf: value }))}
            onValidationChange={(isValid, error) => handleValidationChange('uf', isValid, error)}
            error={validationErrors.uf}
            required
            placeholder="Selecione o estado..."
            helperText="Estado brasileiro onde o cliente está localizado"
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
              href="/dashboard/clients"
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
