'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContextBasic'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type UserRole = 'admin' | 'manager' | 'viewer'

interface MenuConfig {
  dashboard: UserRole[]
  modules: UserRole[]
  clients: UserRole[]
  versions: UserRole[]
  reports: UserRole[]
  users: UserRole[]
}

const MENU_LABELS = {
  dashboard: 'Dashboard',
  modules: 'Módulos',
  clients: 'Clientes', 
  versions: 'Versões',
  reports: 'Relatórios',
  users: 'Usuários'
}

const ROLE_LABELS = {
  admin: 'Administrador',
  manager: 'Gerente',
  viewer: 'Visualizador'
}

export default function MenuConfigPage() {
  const { role, menuConfig, updateMenuConfig } = useAuth()
  const router = useRouter()
  const [config, setConfig] = useState<MenuConfig>(menuConfig)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Redirecionar se não for admin
  useEffect(() => {
    if (role && role !== 'admin') {
      router.push('/dashboard')
    }
  }, [role, router])

  const handleRoleToggle = (menuKey: keyof MenuConfig, roleKey: UserRole) => {
    setConfig(prev => {
      const currentRoles = prev[menuKey]
      const hasRole = currentRoles.includes(roleKey)
      
      return {
        ...prev,
        [menuKey]: hasRole 
          ? currentRoles.filter(r => r !== roleKey)
          : [...currentRoles, roleKey]
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      await updateMenuConfig(config)
      setMessage('✅ Configuração salva com sucesso!')
      
      setTimeout(() => {
        setMessage('')
      }, 3000)
    } catch (error) {
      setMessage('❌ Erro ao salvar configuração')
      console.error('Erro ao salvar:', error)
    } finally {
      setSaving(false)
    }
  }

  const resetToDefault = () => {
    const defaultConfig: MenuConfig = {
      dashboard: ['admin', 'manager', 'viewer'],
      modules: ['admin', 'manager'],
      clients: ['admin', 'manager'],
      versions: ['admin', 'manager'],
      reports: ['admin', 'manager', 'viewer'],
      users: ['admin']
    }
    setConfig(defaultConfig)
  }

  if (role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Acesso negado. Apenas administradores.</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Configuração de Menus
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure quais roles podem ver cada menu
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          ℹ️ Como funciona
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• <strong>Admin</strong>: Sempre vê todos os menus (não pode ser desabilitado)</li>
          <li>• <strong>Manager</strong>: Pode ver menus selecionados</li>
          <li>• <strong>Viewer</strong>: Pode ver apenas menus básicos selecionados</li>
        </ul>
      </div>

      {/* Configuration Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Permissões por Menu
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Menu
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Viewer
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(MENU_LABELS).map(([menuKey, label]) => (
                <tr key={menuKey} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {label}
                  </td>
                  
                  {/* Admin - sempre ativo */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled={true}
                      className="h-4 w-4 text-blue-600 rounded opacity-50 cursor-not-allowed"
                    />
                  </td>
                  
                  {/* Manager */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={config[menuKey as keyof MenuConfig].includes('manager')}
                      onChange={() => handleRoleToggle(menuKey as keyof MenuConfig, 'manager')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  
                  {/* Viewer */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={config[menuKey as keyof MenuConfig].includes('viewer')}
                      onChange={() => handleRoleToggle(menuKey as keyof MenuConfig, 'viewer')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={resetToDefault}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Restaurar Padrão
        </button>
        
        <div className="flex items-center gap-4">
          {message && (
            <span className={`text-sm ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </span>
          )}
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Configuração'}
          </button>
        </div>
      </div>
    </div>
  )
}