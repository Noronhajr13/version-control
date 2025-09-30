'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import Link from 'next/link'
import { Plus, Trash2 } from '@/src/components/ui/icons'
import { useCreateVersion } from '@/src/lib/react-query/hooks/useVersions'
import { useQueryClient } from '@tanstack/react-query'
import { ErrorManager } from '@/src/lib/utils/errorHandler'
import { FileUploadZip } from '@/src/components/ui/FileUploadZip'

// Removido supabaseOperation - usando cliente diretamente

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
  const [cards, setCards] = useState<{ jira_number: string; last_update: string }[]>([])
  
  const [formData, setFormData] = useState({
    module_id: '',
    tag: '',
    jira_card: '',
    version_number: '',
    release_date: '',
    scripts: '',
    powerbuilder_version: '',
    exe_path: '',
    description: '',
    status: 'interna' as 'interna' | 'testes' | 'producao',
    data_generation: ''
  })
  
  const [zipFile, setZipFile] = useState<File | null>(null)

  // Status options para o select
  const statusOptions = [
    { value: 'interna', label: 'Interna', color: 'bg-gray-100 text-gray-800' },
    { value: 'testes', label: 'Testes', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'producao', label: 'Produção', color: 'bg-green-100 text-green-800' }
  ]

  // Mock data para versões PowerBuilder
  const powerbuildervVersions = [
    '2022 R3 Build 2828',
    '2022 R3 Build 3356',
    '2025 Build 3683',
    '2025 Build 3711'
  ]
  
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const createVersionMutation = useCreateVersion()

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
    
    // Validar arquivo ZIP obrigatório
    if (!zipFile) {
      alert('Arquivo ZIP é obrigatório!')
      return
    }
    
    const loadingToast = ErrorManager.showLoading('Criando versão...')
    setIsLoading(true)

    try {
      let fileUrl = ''
      
      // Upload do arquivo ZIP para o Supabase Storage
      if (zipFile) {
        const fileName = `versions/${Date.now()}-${zipFile.name}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('version-files')
          .upload(fileName, zipFile)
        
        if (uploadError) {
          throw new Error(`Erro no upload: ${uploadError.message}`)
        }
        
        // Obter URL pública do arquivo
        const { data: { publicUrl } } = supabase.storage
          .from('version-files')
          .getPublicUrl(fileName)
          
        fileUrl = publicUrl
      }
      
      // Criar a versão com a URL do arquivo
      const versionDataToInsert = {
        ...formData,
        file_path: fileUrl, // Substituir exe_path por file_path
      }
      
      const { data: versionData, error: versionError } = await supabase
        .from('versions')
        .insert([versionDataToInsert])
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
          const { error: cardsError } = await supabase
            .from('cards')
            .insert(cardsToInsert)
          
          if (cardsError) throw cardsError
        }
      }

      // Adicionar clientes se a tabela existe
      if (selectedClients.length > 0 && versionData) {
        try {
          const versionClientsToInsert = selectedClients.map(clientId => ({
            version_id: versionData.id,
            client_id: clientId
          }))

          const { error: clientsError } = await supabase
            .from('version_clients')
            .insert(versionClientsToInsert)
          
          if (clientsError) {
            console.warn('Tabela version_clients não encontrada ou erro ao inserir clientes:', clientsError)
            // Não falha a criação da versão se os clientes não puderem ser associados
          }
        } catch (clientError) {
          console.warn('Erro ao associar clientes à versão:', clientError)
          // Continue sem falhar
        }
      }

      ErrorManager.showSuccessMessage('create', 'Versão')
      
      // Invalidar cache do React Query para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['versions'] })
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      
      router.push('/dashboard/versions')
    } catch (error: unknown) {
      ErrorManager.handleGenericError(error)
    } finally {
      ErrorManager.dismissLoading(loadingToast)
      setIsLoading(false)
    }
  }

  return (
    <div>
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
                Data de Geração *
              </label>
              <input
                type="date"
                required
                value={formData.data_generation}
                onChange={(e) => setFormData({ ...formData, data_generation: e.target.value })}
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
                Status da Versão *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'interna' | 'testes' | 'producao' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
                Arquivo da Versão (ZIP) *
              </label>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                📦 Faça upload do arquivo ZIP da versão para download direto pelos clientes
              </div>
              <FileUploadZip
                value={zipFile}
                onChange={setZipFile}
                placeholder="Arraste o arquivo ZIP aqui ou clique para selecionar"
                maxSize={100} // 100MB para arquivos de versão
                accept=".zip,.rar,.7z"
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
            href="/dashboard/versions"
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}