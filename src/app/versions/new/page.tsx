'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
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

export default function NewVersionPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [cards, setCards] = useState<{ jira_number: string; last_update: string }[]>([])
  
  const [formData, setFormData] = useState({
    module_id: '',
    tag: '',
    jira_card: '',
    themes_folder: '',
    version_number: '',
    release_date: '',
    script_executed: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [modulesRes, clientsRes] = await Promise.all([
      supabase.from('modules').select('*').order('name'),
      supabase.from('clients').select('*').order('name')
    ])

    if (modulesRes.data) setModules(modulesRes.data)
    if (clientsRes.data) setClients(clientsRes.data)
  }

  const handleAddCard = () => {
    setCards([...cards, { jira_number: '', last_update: new Date().toISOString().split('T')[0] }])
  }

  const handleRemoveCard = (index: number) => {
    setCards(cards.filter((_, i) => i !== index))
  }

  const handleCardChange = (index: number, field: string, value: string) => {
    const newCards = [...cards]
    newCards[index] = { ...newCards[index], [field]: value }
    setCards(newCards)
  }

  const handleClientToggle = (clientId: string) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter(id => id !== clientId))
    } else {
      setSelectedClients([...selectedClients, clientId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Criar a versão
      const { data: versionData, error: versionError } = await supabaseOperation(supabase
        .from('versions'))
        .insert([formData])
        .select()
        .single()

      if (versionError) throw versionError

      // Adicionar cards
      if (cards.length > 0 && versionData) {
        const cardsToInsert = cards
          .filter(card => card.jira_number)
          .map(card => ({
            ...card,
            version_id: versionData.id
          }))

        if (cardsToInsert.length > 0) {
          const { error: cardsError } = await supabaseOperation(supabase
            .from('cards'))
            .insert(cardsToInsert)
          
          if (cardsError) throw cardsError
        }
      }

      // Adicionar clientes
      if (selectedClients.length > 0 && versionData) {
        const versionClientsToInsert = selectedClients.map(clientId => ({
          version_id: versionData.id,
          client_id: clientId
        }))

        const { error: clientsError } = await supabaseOperation(supabase
          .from('version_clients'))
          .insert(versionClientsToInsert)
        
        if (clientsError) throw clientsError
      }

      toast.success('Versão criada com sucesso')
      router.push('/versions')
      router.refresh()
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error('Erro ao criar versão: ' + error.message)
      } else {
        toast.error('Erro ao criar versão')
      }
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Nova Versão
      </h1>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Informações Básicas */}
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Informações Básicas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Módulo *
              </label>
              <select
                required
                value={formData.module_id}
                onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Selecione...</option>
                {modules.map(module => (
                  <option key={module.id} value={module.id}>{module.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número da Versão *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 4.24083.00"
                value={formData.version_number}
                onChange={(e) => setFormData({ ...formData, version_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tag *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: v4.24.83"
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Liberação
              </label>
              <input
                type="date"
                value={formData.release_date}
                onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Card Jira Principal
              </label>
              <input
                type="text"
                placeholder="Ex: https://jira.com/browse/PROJ-123"
                value={formData.jira_card}
                onChange={(e) => setFormData({ ...formData, jira_card: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pasta Themes
              </label>
              <input
                type="text"
                placeholder="Ex: /themes/v4"
                value={formData.themes_folder}
                onChange={(e) => setFormData({ ...formData, themes_folder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Script Executado
            </label>
            <textarea
              rows={4}
              placeholder="Scripts SQL executados nesta versão..."
              value={formData.script_executed}
              onChange={(e) => setFormData({ ...formData, script_executed: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Cards Jira */}
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cards Jira</h2>
            <button
              type="button"
              onClick={handleAddCard}
              className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Card
            </button>
          </div>

          {cards.map((card, index) => (
            <div key={index} className="flex gap-4 mb-3">
              <input
                type="text"
                placeholder="Número/Link do Card"
                value={card.jira_number}
                onChange={(e) => handleCardChange(index, 'jira_number', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              />
              <input
                type="date"
                value={card.last_update}
                onChange={(e) => handleCardChange(index, 'last_update', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => handleRemoveCard(index)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Clientes */}
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Clientes que Usam Esta Versão</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {clients.map(client => (
              <label key={client.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedClients.includes(String(client.id))}
                  onChange={() => handleClientToggle(String(client.id))}
                  className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {client.name} {('uf' in client ? `(${client.uf})` : '')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Salvando...' : 'Salvar Versão'}
          </button>
          <Link
            href="/versions"
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}