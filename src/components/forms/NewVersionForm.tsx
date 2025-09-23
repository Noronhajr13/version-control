'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

// Utility function para contornar problemas de tipo do Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseOperation = (operation: any) => operation

interface Module {
  id: number;
  name: string;
}

interface Client {
  id: number;
  name: string;
}

export function NewVersionForm() {
  const [modules, setModules] = useState<Module[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    module_id: '',
    version: '',
    tag: '',
    release_date: '',
    description: '',
    changes: [''],
    packages: ['']
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [modulesRes, clientsRes] = await Promise.all([
          supabaseOperation(supabase.from('modules').select('*').order('name')),
          supabaseOperation(supabase.from('clients').select('*').order('name'))
        ])

        if (modulesRes.error) {
          toast.error('Erro ao carregar módulos: ' + modulesRes.error.message)
        } else {
          setModules(modulesRes.data || [])
        }

        if (clientsRes.error) {
          toast.error('Erro ao carregar clientes: ' + clientsRes.error.message)
        } else {
          setClients(clientsRes.data || [])
        }
      } catch (error) {
        toast.error('Erro ao carregar dados')
        console.error(error)
      }
    }

    loadData()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validação básica
      if (!formData.module_id || !formData.version || !formData.tag || !formData.release_date) {
        toast.error('Preencha todos os campos obrigatórios')
        setIsLoading(false)
        return
      }

      // Criar versão
      const versionData = {
        module_id: parseInt(formData.module_id),
        version: formData.version,
        tag: formData.tag,
        release_date: formData.release_date,
        description: formData.description,
        changes: formData.changes.filter(change => change.trim() !== ''),
        packages: formData.packages.filter(pkg => pkg.trim() !== '')
      }

      const { data: version, error: versionError } = await supabaseOperation(
        supabase
          .from('versions')
          .insert(versionData)
          .select()
          .single()
      )

      if (versionError) {
        toast.error('Erro ao criar versão: ' + versionError.message)
        setIsLoading(false)
        return
      }

      // Associar clientes selecionados
      if (selectedClients.length > 0 && version) {
        const clientVersions = selectedClients.map(clientId => ({
          version_id: version.id,
          client_id: parseInt(clientId)
        }))

        const { error: clientError } = await supabaseOperation(
          supabase
            .from('version_clients')
            .insert(clientVersions)
        )

        if (clientError) {
          toast.error('Erro ao associar clientes: ' + clientError.message)
        }
      }

      toast.success('Versão criada com sucesso!')
      router.push('/dashboard/versions')
    } catch (error) {
      console.error('Erro ao criar versão:', error)
      toast.error('Erro inesperado ao criar versão')
    } finally {
      setIsLoading(false)
    }
  }

  const addChange = () => {
    setFormData(prev => ({
      ...prev,
      changes: [...prev.changes, '']
    }))
  }

  const removeChange = (index: number) => {
    setFormData(prev => ({
      ...prev,
      changes: prev.changes.filter((_, i) => i !== index)
    }))
  }

  const updateChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      changes: prev.changes.map((change, i) => i === index ? value : change)
    }))
  }

  const addPackage = () => {
    setFormData(prev => ({
      ...prev,
      packages: [...prev.packages, '']
    }))
  }

  const removePackage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index)
    }))
  }

  const updatePackage = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.map((pkg, i) => i === index ? value : pkg)
    }))
  }

  const handleClientToggle = (clientId: string) => {
    setSelectedClients(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId)
      } else {
        return [...prev, clientId]
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Módulo */}
        <div>
          <label htmlFor="module_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Módulo *
          </label>
          <select
            id="module_id"
            value={formData.module_id}
            onChange={(e) => setFormData(prev => ({ ...prev, module_id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="">Selecione um módulo</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.name}
              </option>
            ))}
          </select>
        </div>

        {/* Versão */}
        <div>
          <label htmlFor="version" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Versão *
          </label>
          <input
            type="text"
            id="version"
            value={formData.version}
            onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="1.0.0"
            required
          />
        </div>

        {/* Tag */}
        <div>
          <label htmlFor="tag" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tag *
          </label>
          <input
            type="text"
            id="tag"
            value={formData.tag}
            onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="v1.0.0"
            required
          />
        </div>

        {/* Data de Liberação */}
        <div>
          <label htmlFor="release_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Data de Liberação *
          </label>
          <input
            type="date"
            id="release_date"
            value={formData.release_date}
            onChange={(e) => setFormData(prev => ({ ...prev, release_date: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Descrição
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Descrição da versão..."
        />
      </div>

      {/* Alterações */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Alterações
          </label>
          <button
            type="button"
            onClick={addChange}
            className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </button>
        </div>
        <div className="space-y-2">
          {formData.changes.map((change, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={change}
                onChange={(e) => updateChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Descreva a alteração..."
              />
              {formData.changes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeChange(index)}
                  className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pacotes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Pacotes
          </label>
          <button
            type="button"
            onClick={addPackage}
            className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </button>
        </div>
        <div className="space-y-2">
          {formData.packages.map((pkg, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={pkg}
                onChange={(e) => updatePackage(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Nome do pacote..."
              />
              {formData.packages.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePackage(index)}
                  className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Clientes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Clientes
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {clients.map((client) => (
            <label key={client.id} className="flex items-center space-x-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={selectedClients.includes(client.id.toString())}
                onChange={() => handleClientToggle(client.id.toString())}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{client.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Botões */}
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Criando...' : 'Criar Versão'}
        </button>
      </div>
    </form>
  )
}