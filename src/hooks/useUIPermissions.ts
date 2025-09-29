'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import { useAuth } from './useAuth'
import { UIPermissionWithElement } from '@/src/lib/types/database'

interface UIPermissions {
  [elementKey: string]: {
    visible: boolean
    enabled: boolean
  }
}

export function useUIPermissions() {
  const [permissions, setPermissions] = useState<UIPermissions>({})
  const [loading, setLoading] = useState(true)
  const { userProfile } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (!userProfile?.id) {
      setLoading(false)
      return
    }

    fetchUIPermissions()
  }, [userProfile?.id])

  const fetchUIPermissions = async () => {
    if (!userProfile?.id) return

    try {
      setLoading(true)
      
      // Usar a função RPC para buscar permissões de UI
      const { data, error } = await supabase
        .rpc('get_user_ui_permissions', { user_id_param: userProfile.id })

      if (error) {
        console.error('Error fetching UI permissions:', error)
        // Fallback para permissões padrão baseadas na role
        setPermissions(getDefaultPermissionsByRole(userProfile.role))
        return
      }

      // Converter array de permissões em objeto indexado
      const permissionsMap: UIPermissions = {}
      
      if (data) {
        data.forEach((perm: UIPermissionWithElement) => {
          permissionsMap[perm.element_key] = {
            visible: perm.is_visible,
            enabled: perm.is_enabled
          }
        })
      }

      setPermissions(permissionsMap)
    } catch (error) {
      console.error('Error in fetchUIPermissions:', error)
      // Fallback para permissões padrão
      setPermissions(getDefaultPermissionsByRole(userProfile.role))
    } finally {
      setLoading(false)
    }
  }

  // Função para verificar se elemento está visível
  const isVisible = (elementKey: string): boolean => {
    if (!userProfile) return false
    
    // Super admin tem acesso total
    if (userProfile.role === 'super_admin') return true
    
    // Verificar permissão específica
    if (permissions[elementKey]) {
      return permissions[elementKey].visible
    }
    
    // Fallback para permissões padrão da role
    return getDefaultPermissionForElement(userProfile.role, elementKey, 'visible')
  }

  // Função para verificar se elemento está habilitado
  const isEnabled = (elementKey: string): boolean => {
    if (!userProfile) return false
    
    // Super admin tem acesso total
    if (userProfile.role === 'super_admin') return true
    
    // Elemento precisa estar visível para estar habilitado
    if (!isVisible(elementKey)) return false
    
    // Verificar permissão específica
    if (permissions[elementKey]) {
      return permissions[elementKey].enabled
    }
    
    // Fallback para permissões padrão da role
    return getDefaultPermissionForElement(userProfile.role, elementKey, 'enabled')
  }

  // Função para verificar múltiplos elementos de uma vez
  const checkPermissions = (elementKeys: string[], type: 'visible' | 'enabled' = 'visible') => {
    return elementKeys.reduce((acc, key) => {
      acc[key] = type === 'visible' ? isVisible(key) : isEnabled(key)
      return acc
    }, {} as Record<string, boolean>)
  }

  return {
    permissions,
    loading,
    isVisible,
    isEnabled,
    checkPermissions,
    refetch: fetchUIPermissions
  }
}

// Função auxiliar para permissões padrão por role
function getDefaultPermissionsByRole(role: string): UIPermissions {
  const allElements = [
    'sidebar_dashboard',
    'sidebar_modules',
    'sidebar_clients', 
    'sidebar_versions',
    'sidebar_reports',
    'sidebar_audit',
    'sidebar_users',
    'button_create_module',
    'button_edit_module',
    'button_delete_module',
    'button_create_client',
    'button_edit_client', 
    'button_delete_client',
    'button_create_version',
    'button_edit_version',
    'button_delete_version',
    'section_dashboard_metrics',
    'section_dashboard_charts',
    'feature_export_data',
    'feature_bulk_actions',
    'feature_advanced_filters'
  ]

  const permissions: UIPermissions = {}
  
  allElements.forEach(element => {
    permissions[element] = {
      visible: getDefaultPermissionForElement(role, element, 'visible'),
      enabled: getDefaultPermissionForElement(role, element, 'enabled')
    }
  })

  return permissions
}

// Função auxiliar para verificar permissão padrão individual
function getDefaultPermissionForElement(role: string, elementKey: string, type: 'visible' | 'enabled'): boolean {
  // Super admin tem acesso total
  if (role === 'super_admin') return true
  
  // Admin tem acesso quase total
  if (role === 'admin') return true
  
  // Manager - sem deletar e sem usuários
  if (role === 'manager') {
    if (elementKey.includes('delete')) return false
    if (elementKey === 'sidebar_users') return false
    return true
  }
  
  // Editor - sem deletar, sem usuários, sem auditoria
  if (role === 'editor') {
    if (elementKey.includes('delete')) return false
    if (elementKey === 'sidebar_users') return false
    if (elementKey === 'sidebar_audit') return false
    return true
  }
  
  // Viewer - apenas visualização
  if (role === 'viewer') {
    if (elementKey.includes('create')) return false
    if (elementKey.includes('edit')) return false
    if (elementKey.includes('delete')) return false
    if (elementKey === 'sidebar_users') return false
    if (elementKey === 'feature_export_data') return false
    return true
  }
  
  return false
}