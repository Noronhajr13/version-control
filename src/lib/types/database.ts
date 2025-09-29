export interface Database {
  public: {
    Tables: {
      modules: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          uf: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          uf: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          uf?: string
          created_at?: string
        }
      }
      versions: {
        Row: {
          id: string
          module_id: string
          tag: string
          jira_card: string | null
          themes_folder: string | null
          version_number: string
          release_date: string | null
          scripts: string | null
          powerbuilder_version: string | null
          exe_path: string | null
          status: 'interna' | 'teste' | 'homologacao' | 'producao' | 'deprecated' | null
          data_generation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          module_id: string
          tag: string
          jira_card?: string | null
          themes_folder?: string | null
          version_number: string
          release_date?: string | null
          scripts?: string | null
          powerbuilder_version?: string | null
          exe_path?: string | null
          status?: 'interna' | 'teste' | 'homologacao' | 'producao' | 'deprecated' | null
          data_generation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          tag?: string
          jira_card?: string | null
          themes_folder?: string | null
          version_number?: string
          release_date?: string | null
          scripts?: string | null
          powerbuilder_version?: string | null
          exe_path?: string | null
          status?: 'interna' | 'teste' | 'homologacao' | 'producao' | 'deprecated' | null
          data_generation?: string | null
          created_at?: string
        }
      }
      cards: {
        Row: {
          id: string
          version_id: string
          jira_number: string
          last_update: string
        }
        Insert: {
          id?: string
          version_id: string
          jira_number: string
          last_update?: string
        }
        Update: {
          id?: string
          version_id?: string
          jira_number?: string
          last_update?: string
        }
      }
      version_clients: {
        Row: {
          id: string
          version_id: string
          client_id: string
        }
        Insert: {
          id?: string
          version_id: string
          client_id: string
        }
        Update: {
          id?: string
          version_id?: string
          client_id?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          table_name: string
          operation_type: 'INSERT' | 'UPDATE' | 'DELETE'
          record_id: string
          old_values: Record<string, any> | null
          new_values: Record<string, any> | null
          changed_fields: string[]
          user_id: string | null
          user_email: string | null
          user_agent: string | null
          ip_address: string | null
          timestamp: string
          session_id: string | null
          request_id: string | null
          description: string | null
          tags: string[] | null
        }
        Insert: {
          id?: string
          table_name: string
          operation_type: 'INSERT' | 'UPDATE' | 'DELETE'
          record_id: string
          old_values?: Record<string, any> | null
          new_values?: Record<string, any> | null
          changed_fields?: string[]
          user_id?: string | null
          user_email?: string | null
          user_agent?: string | null
          ip_address?: string | null
          timestamp?: string
          session_id?: string | null
          request_id?: string | null
          description?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: string
          table_name?: string
          operation_type?: 'INSERT' | 'UPDATE' | 'DELETE'
          record_id?: string
          old_values?: Record<string, any> | null
          new_values?: Record<string, any> | null
          changed_fields?: string[]
          user_id?: string | null
          user_email?: string | null
          user_agent?: string | null
          ip_address?: string | null
          timestamp?: string
          session_id?: string | null
          request_id?: string | null
          description?: string | null
          tags?: string[] | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          role: 'super_admin' | 'admin' | 'manager' | 'editor' | 'viewer'
          department: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          last_login_at: string | null
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          role?: 'super_admin' | 'admin' | 'manager' | 'editor' | 'viewer'
          department?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          last_login_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          role?: 'super_admin' | 'admin' | 'manager' | 'editor' | 'viewer'
          department?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          last_login_at?: string | null
        }
      }
      user_permissions: {
        Row: {
          id: string
          user_id: string
          resource: string
          action: string
          allowed: boolean
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          resource: string
          action: string
          allowed?: boolean
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          resource?: string
          action?: string
          allowed?: boolean
          created_at?: string
          created_by?: string | null
        }
      }
    }
    Views: {
      audit_logs_with_user_info: {
        Row: {
          id: string
          table_name: string
          operation_type: 'INSERT' | 'UPDATE' | 'DELETE'
          record_id: string
          old_values: Record<string, any> | null
          new_values: Record<string, any> | null
          changed_fields: string[]
          user_id: string | null
          user_email: string | null
          user_agent: string | null
          ip_address: string | null
          timestamp: string
          session_id: string | null
          request_id: string | null
          description: string | null
          tags: string[] | null
          user_display_email: string | null
          user_created_at: string | null
        }
      }
      audit_summary_by_table: {
        Row: {
          table_name: string
          operation_type: 'INSERT' | 'UPDATE' | 'DELETE'
          operation_count: number
          unique_users: number
          first_operation: string
          last_operation: string
        }
      }
      recent_audit_activity: {
        Row: {
          id: string
          table_name: string
          operation_type: 'INSERT' | 'UPDATE' | 'DELETE'
          record_id: string
          old_values: Record<string, any> | null
          new_values: Record<string, any> | null
          changed_fields: string[]
          user_id: string | null
          user_email: string | null
          user_agent: string | null
          ip_address: string | null
          timestamp: string
          session_id: string | null
          request_id: string | null
          description: string | null
          tags: string[] | null
          user_display_email: string | null
        }
      }
    }
    Functions: {
      get_audit_stats: {
        Returns: {
          total_logs: number
          logs_last_7_days: number
          logs_last_30_days: number
          most_active_table: string
          most_active_user: string
        }[]
      }
      cleanup_old_audit_logs: {
        Returns: number
      }
      has_permission: {
        Args: {
          user_id_param: string
          resource_param: string
          action_param: string
        }
        Returns: boolean
      }
      get_user_with_permissions: {
        Args: {
          user_id_param: string
        }
        Returns: {
          id: string
          email: string
          display_name: string | null
          role: 'super_admin' | 'admin' | 'manager' | 'editor' | 'viewer'
          department: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          last_login_at: string | null
          permissions: Record<string, any>
        }[]
      }
    }
  }
}

// Exported types for convenience
export type VersionStatus = 'interna' | 'teste' | 'homologacao' | 'producao' | 'deprecated'
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'editor' | 'viewer'

export interface UserProfile {
  id: string
  email: string
  display_name: string | null
  role: UserRole
  department: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  last_login_at: string | null
}

export interface UserPermission {
  id: string
  user_id: string
  resource: string
  action: string
  allowed: boolean
  created_at: string
  created_by: string | null
}

export interface UserWithPermissions extends UserProfile {
  permissions: Record<string, boolean>
}