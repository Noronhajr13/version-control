'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/src/lib/types/database'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const [formData, setFormData] = useState({ name: '', uf: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [clientId, setClientId] = useState('')
  const router = useRouter()

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const initializeParams = async () => {
      const { id } = await params
      setClientId(id)
    }
    initializeParams()
  }, [params])

  useEffect(() => {
    if (clientId) {
      loadClient()
    }
  }, [clientId])

  const loadClient = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single<Database['public']['Tables']['clients']['Row']>()

    if (error) {
      toast.error('Erro ao carregar cliente')
      router.push('/clients')
    } else if (data) {
      setFormData({ name: data.name, uf: data.uf })
    }
    setIsPageLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await (supabase
      .from('clients') as unknown as {
        update: (data: { name: string; uf: string }) => {
          eq: (field: string, value: string) => Promise<{ error: Error | null }>
        }
      })
      .update({ name: formData.name, uf: formData.uf })
      .eq('id', clientId)

    if (error) {
      toast.error('Erro ao atualizar cliente')
      setIsLoading(false)
    } else {
      toast.success('Cliente atualizado com sucesso')
      router.push('/clients')
      router.refresh()
    }
  }

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Editar Cliente
      </h1>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome do Cliente
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Ex: Empresa ABC"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="uf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              UF
            </label>
            <select
              id="uf"
              required
              value={formData.uf}
              onChange={(e) => setFormData(prev => ({ ...prev, uf: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Selecione...</option>
              {UF_LIST.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
            <Link
              href="/clients"
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
