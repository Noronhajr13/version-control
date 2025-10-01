'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/lib/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { UserPlus, Search, Mail, User, X } from 'lucide-react'

interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    name?: string
    full_name?: string
  }
  created_at: string
}

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserAdded: () => void
}

export function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('viewer')
  const supabase = createClient()

  const searchAuthUsers = async () => {
    if (!searchTerm.trim()) {
      toast.error('Digite um email ou nome para buscar')
      return
    }

    try {
      setLoading(true)
      
      // Buscar usuários do auth.users que não estão em user_profiles
      const { data, error } = await supabase
        .rpc('search_unregistered_users', { search_term: searchTerm })

      if (error) {
        console.error('Error searching users:', error)
        toast.error('Erro ao buscar usuários')
        return
      }

      setAuthUsers(data || [])
      
      if (!data || data.length === 0) {
        toast.info('Nenhum usuário encontrado ou todos já estão registrados')
      }
    } catch (error) {
      console.error('Error in searchAuthUsers:', error)
      toast.error('Erro ao buscar usuários')
    } finally {
      setLoading(false)
    }
  }

  const addUserToProfiles = async (authUser: AuthUser) => {
    try {
      setAdding(true)
      
      const displayName = authUser.user_metadata?.name || 
                         authUser.user_metadata?.full_name || 
                         authUser.email.split('@')[0]

      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: authUser.id,
          email: authUser.email,
          display_name: displayName,
          role: selectedRole,
          is_active: true
        })

      if (error) {
        console.error('Error adding user:', error)
        toast.error('Erro ao adicionar usuário')
        return
      }

      toast.success(`Usuário ${authUser.email} adicionado com sucesso!`)
      
      // Remover da lista de usuários disponíveis
      setAuthUsers(prev => prev.filter(u => u.id !== authUser.id))
      
      // Notificar componente pai para recarregar
      onUserAdded()
      
      // Se não há mais usuários, fechar modal
      if (authUsers.length <= 1) {
        handleClose()
      }
    } catch (error) {
      console.error('Error in addUserToProfiles:', error)
      toast.error('Erro ao adicionar usuário')
    } finally {
      setAdding(false)
    }
  }

  const handleClose = () => {
    setSearchTerm('')
    setAuthUsers([])
    setSelectedRole('viewer')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            <UserPlus className="w-5 h-5 mr-2 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Adicionar Usuários Existentes
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Busca de Usuários */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Digite email ou nome do usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchAuthUsers()}
                className="flex-1"
              />
              <Button
                onClick={searchAuthUsers}
                disabled={loading || !searchTerm.trim()}
                variant="outline"
              >
                <Search className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Buscar
              </Button>
            </div>

            {/* Seleção de Role Padrão */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Role padrão para novos usuários:
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="viewer">Viewer</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Lista de Usuários Encontrados */}
          <div className="max-h-96 overflow-y-auto">
            {authUsers.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Usuários encontrados ({authUsers.length})
                </h3>
                
                {authUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.user_metadata?.name || user.user_metadata?.full_name || user.email.split('@')[0]}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          Registrado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => addUserToProfiles(user)}
                      disabled={adding}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Adicionar como {selectedRole}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instruções */}
          {authUsers.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">Use a busca acima para encontrar usuários</p>
              <p className="text-sm">
                Serão mostrados apenas usuários que se registraram no sistema<br />
                mas ainda não possuem perfil de role configurado.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </Card>
    </div>
  )
}