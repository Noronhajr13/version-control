'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, UserRole } from '@/lib/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AdminOnly } from '@/components/auth/SimpleProtectedComponent'
import { AddUserModal } from '@/components/admin/AddUserModal'
import { useAuth } from '@/contexts/AuthContextBasic'
import { toast } from 'sonner'
import { User, Shield, Clock, Mail, Building, UserPlus, BarChart3, RefreshCw } from 'lucide-react'

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador', 
  manager: 'Gerente',
  viewer: 'Visualizador'
}

const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [userStats, setUserStats] = useState<{
    total_auth_users: number
    total_profiles: number
    unregistered_users: number
    active_profiles: number
  } | null>(null)
  const { userProfile } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
    fetchUserStats()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      console.log('Fetching user stats...')
      const { data, error } = await supabase
        .rpc('get_user_stats')
        .single()

      if (error) {
        console.warn('Error fetching user stats (function may not exist):', error)
        // Criar stats básicas como fallback
        const fallbackStats = {
          total_auth_users: users.length,
          total_profiles: users.length,
          active_profiles: users.filter(u => u.is_active).length,
          unregistered_users: 0
        }
        setUserStats(fallbackStats)
        return
      }

      console.log('User stats fetched successfully')
      setUserStats(data as any)
    } catch (error) {
      console.warn('Error in fetchUserStats:', error)
    }
  }

  const handleUserAdded = () => {
    fetchUsers()
    fetchUserStats()
  }

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error
      
      toast.success('Role do usuário atualizada com sucesso')
      fetchUsers()
      setEditingUser(null)
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Erro ao atualizar role do usuário')
    }
  }

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          is_active: !isActive, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)

      if (error) throw error
      
      toast.success(`Usuário ${!isActive ? 'ativado' : 'desativado'} com sucesso`)
      fetchUsers()
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast.error('Erro ao alterar status do usuário')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canEditUser = (targetUser: UserProfile) => {
    if (!userProfile) return false
    
    // Admin pode editar qualquer um
    if (userProfile.role === 'admin') return true
    
    return false
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando usuários...</div>
      </div>
    )
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gerenciamento de Usuários
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie roles e permissões dos usuários do sistema
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowAddUserModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar Usuário
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                fetchUsers()
                fetchUserStats()
              }}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Estatísticas de Usuários */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Autenticados
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats.total_auth_users}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Com Perfil
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats.total_profiles}
                  </p>
                </div>
                <User className="w-8 h-8 text-green-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Sem Perfil
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {userStats.unregistered_users}
                  </p>
                </div>
                <UserPlus className="w-8 h-8 text-orange-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Ativos
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {userStats.active_profiles}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </Card>
          </div>
        )}

        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {(user.display_name || user.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        {user.display_name || 'Sem nome'}
                      </h3>
                      <Badge className={roleColors[user.role]}>
                        <Shield className="w-3 h-3 mr-1" />
                        {roleLabels[user.role]}
                      </Badge>
                      {!user.is_active && (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                      
                      {user.department && (
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {user.department}
                        </div>
                      )}
                      
                      {user.last_login_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Último login: {formatDate(user.last_login_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {canEditUser(user) && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingUser(user)}
                    >
                      Editar Role
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      className={user.is_active ? 'text-red-600' : 'text-green-600'}
                    >
                      {user.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Modal de Edição de Role */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                Alterar Role de {editingUser.display_name || editingUser.email}
              </h2>
              
              <div className="space-y-3">
                {Object.entries(roleLabels).map(([role, label]) => {
                  return (
                    <button
                      key={role}
                      onClick={() => updateUserRole(editingUser.id, role as UserRole)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        editingUser.role === role
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${roleColors[role as UserRole]}`} />
                        <span className="font-medium">{label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Modal para Adicionar Usuários */}
        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onUserAdded={handleUserAdded}
        />
      </div>
    </AdminOnly>
  )
}