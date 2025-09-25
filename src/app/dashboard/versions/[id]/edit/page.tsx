'use client'

import { useState, useEffect } from 'react'
import type { Database } from '@/src/lib/types/database'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'
import Link from 'next/link'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

// Utility function para contornar problemas de tipo do Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseOperation = (operation: any) => operation

export default function EditVersionPage({ params }: { params: Promise<{ id: string }> }) {
  const [versionId, setVersionId] = useState('')
  const [modules, setModules] = useState<Database['public']['Tables']['modules']['Row'][]>([])
  const [clients, setClients] = useState<Database['public']['Tables']['clients']['Row'][]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [cards, setCards] = useState<{
    id?: string
    jira_number: string
    last_update: string
  }[]>([])
  const [deletedCards, setDeletedCards] = useState<string[]>([])
  
  const [formData, setFormData] = useState<{
    module_id: string
    tag: string
    jira_card: string
    version_number: string
    release_date: string
    scripts: string
    powerbuilder_version: string
    exe_path: string
    description: string
  }>({
    module_id: '',
    tag: '',
    jira_card: '',
    version_number: '',
    release_date: '',
    scripts: '',
    powerbuilder_version: '',
    exe_path: '',
    description: ''
  })

  // Mock data para versões PowerBuilder
  const powerbuildervVersions = [
    '2022 R3 Build 2828',
    '2022 R3 Build 3356',
    '2025 Build 3683',
    '2025 Build 3711'
  ]
  
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Inicializar parâmetros
  useEffect(() => {
    const initializeParams = async () => {
      const { id } = await params
      setVersionId(id)
    }
    initializeParams()
  }, [params])

  useEffect(() => {
    if (versionId) {
      loadData()
    }
  }, [versionId])

  const loadData = async () => {
    try {
      // Carregar dados gerais
      const [modulesRes, clientsRes] = await Promise.all([
        supabase.from('modules').select('*').order('name'),
        supabase.from('clients').select('*').order('name')
      ])

      if (modulesRes.data) setModules(modulesRes.data)
      if (clientsRes.data) setClients(clientsRes.data)

      // Carregar dados da versão
      const { data: versionData, error: versionError } = await supabase
        .from('versions')
        .select(`*, cards (*), version_clients (client_id)`)
        .eq('id', versionId)
        .single<Database['public']['Tables']['versions']['Row'] & {
          cards?: Database['public']['Tables']['cards']['Row'][]
          version_clients?: { client_id: string }[]
        }>()

      if (versionError || !versionData) {
        toast.error('Erro ao carregar versão')
        router.push('/dashboard/versions')
        return
      }

      // Preencher formulário
      setFormData({
        module_id: versionData.module_id,
        tag: versionData.tag,
        jira_card: versionData.jira_card ?? '',
        version_number: versionData.version_number,
        release_date: versionData.release_date ?? '',
        scripts: (versionData as any).scripts ?? (versionData as any).script_executed ?? '',
        powerbuilder_version: (versionData as any).powerbuilder_version ?? '',
        exe_path: (versionData as any).exe_path ?? '',
        description: (versionData as any).description ?? ''
      })

      // Preencher cards
      if (versionData.cards) {
        setCards(versionData.cards)
      }

      // Preencher clientes selecionados
      if (versionData.version_clients) {
        setSelectedClients(versionData.version_clients.map((vc: { client_id: string }) => vc.client_id))
      }

    } catch (error) {
      toast.error('Erro ao carregar dados')
      router.push('/dashboard/versions')
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleAddCard = () => {
    setCards([...cards, { jira_number: '', last_update: new Date().toISOString().split('T')[0] }])
  }

  const handleRemoveCard = (index: number) => {
    const card = cards[index]
    if (card.id) {
      setDeletedCards([...deletedCards, card.id])
    }
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
      // Atualizar a versão
      const { error: versionError } = await supabaseOperation(supabase
        .from('versions'))
        .update(formData)
        .eq('id', versionId)

      if (versionError) throw versionError

      // Deletar cards removidos
      if (deletedCards.length > 0) {
        const { error: deleteError } = await supabase
          .from('cards')
          .delete()
          .in('id', deletedCards)
        
        if (deleteError) throw deleteError
      }

      // Atualizar/criar cards
      for (const card of cards) {
        if (card.jira_number) {
          if (card.id) {
            // Atualizar card existente
            const { error } = await supabaseOperation(supabase
              .from('cards'))
              .update({
                jira_number: card.jira_number,
                last_update: card.last_update
              })
              .eq('id', card.id)
            
            if (error) throw error
          } else {
            // Criar novo card
            const { error } = await supabaseOperation(supabase
              .from('cards'))
              .insert({
                version_id: versionId,
                jira_number: card.jira_number,
                last_update: card.last_update
              })
            
            if (error) throw error
          }
        }
      }

      // Atualizar clientes
      // Primeiro, remover todos os clientes existentes
      const { error: removeClientsError } = await supabase
        .from('version_clients')
        .delete()
        .eq('version_id', versionId)
      
      if (removeClientsError) throw removeClientsError

      // Adicionar clientes selecionados
      if (selectedClients.length > 0) {
        const versionClientsToInsert: Database['public']['Tables']['version_clients']['Insert'][] = selectedClients.map(clientId => ({
          version_id: versionId,
          client_id: clientId
        }))

        const { error: clientsError } = await supabaseOperation(supabase
          .from('version_clients'))
          .insert(versionClientsToInsert)
        
        if (clientsError) throw clientsError
      }

      toast.success('Versão atualizada com sucesso')
      
      // Invalidar cache do React Query para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['versions'] })
      queryClient.invalidateQueries({ queryKey: ['version', versionId] })
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      
      router.push(`/dashboard/versions/${versionId}`)
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error('Erro ao atualizar versão: ' + error.message)
      } else {
        toast.error('Erro ao atualizar versão')
      }
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Editar Versão
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
                Versão PowerBuilder
              </label>
              <select
                value={formData.powerbuilder_version}
                onChange={(e) => setFormData({ ...formData, powerbuilder_version: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Selecione a versão...</option>
                {powerbuildervVersions.map(version => (
                  <option key={version} value={version}>{version}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Link do EXE (SharePoint)
              </label>
              <input
                type="url"
                placeholder="Ex: https://sharepoint.com/sites/app/exe/app.exe"
                value={formData.exe_path}
                onChange={(e) => setFormData({ ...formData, exe_path: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motivo da Versão e Problemas Solucionados *
            </label>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              📝 Descreva o motivo desta versão e os problemas que ela soluciona
            </div>
            <textarea
              rows={8}
              required
              placeholder={`Motivo da versão:
[Descreva o principal motivo para gerar esta versão]

Problemas solucionados:
• Correção do bug X que afetava Y
• Melhoria na performance da funcionalidade Z
• Ajuste na validação de dados W

Melhorias implementadas:
• Nova funcionalidade A
• Interface mais intuitiva em B
• Otimização do processo C`}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scripts
            </label>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              💡 Adicione múltiplos caminhos de scripts, um por linha (similar aos cards Jira)
            </div>
            <textarea
              rows={6}
              placeholder={`Exemplo:
/scripts/database/001_create_tables.sql
/scripts/database/002_insert_data.sql
/scripts/migration/003_update_schema.sql
/scripts/patches/004_fix_bug.sql`}
              value={formData.scripts}
              onChange={(e) => setFormData({ ...formData, scripts: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white font-mono text-sm"
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
                  checked={selectedClients.includes(client.id)}
                  onChange={() => handleClientToggle(client.id)}
                  className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {client.name} ({client.uf})
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </button>
          <Link
            href={`/dashboard/versions/${versionId}`}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}