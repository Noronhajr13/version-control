'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/src/lib/types/database'
import { toast } from 'sonner'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'

export default function EditModulePage({ params }: { params: Promise<{ id: string }> }) {
  const [formData, setFormData] = useState({ name: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [moduleId, setModuleId] = useState('')
  const router = useRouter()
  const queryClient = useQueryClient()

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const initializeParams = async () => {
      const { id } = await params
      setModuleId(id)
    }
    initializeParams()
  }, [params])

  useEffect(() => {
    if (moduleId) {
      loadModule()
    }
  }, [moduleId])

  const loadModule = async () => {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .single<Database['public']['Tables']['modules']['Row']>()

    if (error) {
      toast.error('Erro ao carregar módulo')
      router.push('/dashboard/modules')
    } else if (data) {
      setFormData({ name: data.name })
    }
    setIsPageLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await (supabase
      .from('modules') as unknown as {
        update: (data: { name: string }) => {
          eq: (field: string, value: string) => Promise<{ error: Error | null }>
        }
      })
      .update({ name: formData.name })
      .eq('id', moduleId)

    if (error) {
      toast.error('Erro ao atualizar módulo')
      setIsLoading(false)
    } else {
      toast.success('Módulo atualizado com sucesso')
      
      // Invalidar cache do React Query para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      queryClient.invalidateQueries({ queryKey: ['module', moduleId] })
      
      router.push('/dashboard/modules')
    }
  }

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Carregando...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Editar Módulo
      </h1>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome do Módulo
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Ex: Módulo Principal"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
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