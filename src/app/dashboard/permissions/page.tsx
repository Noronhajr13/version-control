'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import { UserProfile, UIPermissionWithElement } from '@/src/lib/types/database'
import { Card } from '@/src/components/ui/Card'
import { Button } from '@/src/components/ui/Button'
import { AdminOnly } from '@/src/components/auth/ProtectedComponent'
import { toast } from 'sonner'
import { User, Eye, EyeOff, Settings, Save, RefreshCw } from 'lucide-react'

interface GroupedPermissions {
  [category: string]: UIPermissionWithElement[]
}

export default function UserPermissionsPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [permissions, setPermissions] = useState<UIPermissionWithElement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      fetchUserPermissions(selectedUser.id)
    }
  }, [selectedUser])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
      
      // Selecionar primeiro usuário por padrão
      if (data && data.length > 0) {
        setSelectedUser(data[0])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPermissions = async (userId: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .rpc('get_user_ui_permissions', { user_id_param: userId })

      if (error) throw error
      setPermissions(data || [])
    } catch (error) {
      console.error('Error fetching permissions:', error)
      toast.error('Erro ao carregar permissões do usuário')
    } finally {
      setLoading(false)
    }
  }

  const updatePermission = async (elementKey: string, field: 'is_visible' | 'is_enabled', value: boolean) => {
    if (!selectedUser) return

    try {
      // Encontrar o elemento
      const { data: element, error: elementError } = await supabase
        .from('ui_elements')
        .select('id')
        .eq('element_key', elementKey)
        .single()

      if (elementError) throw elementError

      // Verificar se já existe permissão personalizada
      const { data: existingPermission, error: checkError } = await supabase
        .from('user_ui_permissions')
        .select('*')
        .eq('user_id', selectedUser.id)
        .eq('ui_element_id', element.id)
        .single()

      let result
      if (existingPermission) {
        // Atualizar permissão existente
        result = await supabase
          .from('user_ui_permissions')
          .update({ [field]: value })
          .eq('id', existingPermission.id)
      } else {
        // Criar nova permissão personalizada
        const newPermission = {
          user_id: selectedUser.id,
          ui_element_id: element.id,
          is_visible: field === 'is_visible' ? value : true,
          is_enabled: field === 'is_enabled' ? value : true
        }
        
        result = await supabase
          .from('user_ui_permissions')
          .insert([newPermission])
      }

      if (result.error) throw result.error

      // Atualizar estado local
      setPermissions(prev => prev.map(perm => 
        perm.element_key === elementKey 
          ? { ...perm, [field]: value, has_custom_permission: true }
          : perm
      ))

      toast.success('Permissão atualizada com sucesso')
    } catch (error) {
      console.error('Error updating permission:', error)
      toast.error('Erro ao atualizar permissão')
    }
  }

  const resetUserPermissions = async () => {
    if (!selectedUser) return

    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('user_ui_permissions')
        .delete()
        .eq('user_id', selectedUser.id)

      if (error) throw error

      // Recarregar permissões
      await fetchUserPermissions(selectedUser.id)
      toast.success('Permissões resetadas para padrão da role')
    } catch (error) {
      console.error('Error resetting permissions:', error)
      toast.error('Erro ao resetar permissões')
    } finally {
      setSaving(false)
    }
  }

  // Agrupar permissões por categoria
  const groupedPermissions = permissions.reduce((acc: GroupedPermissions, perm) => {
    let category = ''
    
    if (perm.element_type === 'menu') {
      category = '📋 Menus do Sistema'
    } else if (perm.element_type === 'button') {
      category = `🔘 Botões - ${perm.parent_resource?.toUpperCase() || 'GERAL'}`
    } else if (perm.element_type === 'section') {
      category = '📊 Seções do Dashboard'
    } else if (perm.element_type === 'feature') {
      category = '⚡ Funcionalidades Especiais'
    }
    
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(perm)
    
    return acc
  }, {})

  const getRoleColor = (role: string) => {
    const colors = {
      super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      editor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
    return colors[role as keyof typeof colors] || colors.viewer
  }

  if (loading && !selectedUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gerenciar Permissões de UI
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Configure permissões específicas de interface para cada usuário
            </p>
          </div>
          
          {selectedUser && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fetchUserPermissions(selectedUser.id)}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Recarregar
              </Button>
              
              <Button
                variant="outline"
                onClick={resetUserPermissions}
                disabled={saving}
                className="text-red-600 hover:text-red-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Resetar para Padrão
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lista de Usuários */}
          <Card className="lg:col-span-1">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <User className="w-5 h-5 mr-2" />
                Usuários
              </h2>
            </div>
            
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedUser?.id === user.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {user.display_name || user.email}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Permissões do Usuário Selecionado */}
          <div className="lg:col-span-3">
            {selectedUser ? (
              <Card>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Permissões de {selectedUser.display_name || selectedUser.email}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Role: <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(selectedUser.role)}`}>
                          {selectedUser.role}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-6">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                  ) : (
                    Object.entries(groupedPermissions).map(([category, perms]) => (
                      <div key={category}>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                          {category}
                        </h3>
                        
                        <div className="space-y-2">
                          {perms.map((perm) => (
                            <div
                              key={perm.element_key}
                              className={`p-3 rounded-lg border ${
                                perm.has_custom_permission
                                  ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {perm.element_name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {perm.element_key}
                                  </div>
                                  {perm.has_custom_permission && (
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                      ⚙️ Configuração personalizada
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-4">
                                  {/* Toggle Visível */}
                                  <label className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      Visível
                                    </span>
                                    <button
                                      onClick={() => updatePermission(perm.element_key, 'is_visible', !perm.is_visible)}
                                      className={`p-1 rounded ${
                                        perm.is_visible
                                          ? 'text-green-600 hover:text-green-700'
                                          : 'text-gray-400 hover:text-gray-600'
                                      }`}
                                    >
                                      {perm.is_visible ? (
                                        <Eye className="w-4 h-4" />
                                      ) : (
                                        <EyeOff className="w-4 h-4" />
                                      )}
                                    </button>
                                  </label>
                                  
                                  {/* Toggle Habilitado */}
                                  <label className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      Habilitado
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={perm.is_enabled && perm.is_visible}
                                      disabled={!perm.is_visible}
                                      onChange={(e) => updatePermission(perm.element_key, 'is_enabled', e.target.checked)}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            ) : (
              <Card>
                <div className="p-8 text-center">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Selecione um usuário
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Escolha um usuário na lista para gerenciar suas permissões de interface
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminOnly>
  )
}