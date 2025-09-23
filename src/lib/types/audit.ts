// =====================================================
// SISTEMA DE AUDITORIA - TIPOS TYPESCRIPT
// Data: 2025-09-23
// Descrição: Definições de tipos para audit logs
// =====================================================

export interface AuditLog {
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

export interface AuditLogWithUserInfo extends AuditLog {
  user_display_email: string | null
  user_created_at: string | null
}

export interface AuditSummaryByTable {
  table_name: string
  operation_type: 'INSERT' | 'UPDATE' | 'DELETE'
  operation_count: number
  unique_users: number
  first_operation: string
  last_operation: string
}

export interface AuditStats {
  total_logs: number
  logs_last_7_days: number
  logs_last_30_days: number
  most_active_table: string
  most_active_user: string
}

// Tipos para filtros de auditoria
export interface AuditFilters {
  table_name?: string
  operation_type?: 'INSERT' | 'UPDATE' | 'DELETE'
  user_id?: string
  user_email?: string
  date_from?: string
  date_to?: string
  record_id?: string
  tags?: string[]
  search?: string
}

// Tipos para paginação
export interface AuditPaginationParams {
  page?: number
  per_page?: number
  sort_by?: 'timestamp' | 'table_name' | 'operation_type' | 'user_email'
  sort_order?: 'asc' | 'desc'
}

export interface AuditPaginatedResponse {
  data: AuditLogWithUserInfo[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

// Tipos para timeline
export interface AuditTimelineItem {
  id: string
  timestamp: string
  table_name: string
  operation_type: 'INSERT' | 'UPDATE' | 'DELETE'
  description: string
  user_email: string | null
  record_id: string
  changes_summary: string
  icon: string
  color: string
}

// Tipos para comparação de registros
export interface AuditFieldComparison {
  field_name: string
  old_value: any
  new_value: any
  type: 'added' | 'removed' | 'modified' | 'unchanged'
}

export interface AuditRecordComparison {
  record_id: string
  table_name: string
  old_log_id: string | null
  new_log_id: string
  fields: AuditFieldComparison[]
  timestamp: string
  user_email: string | null
}

// Tipos para estatísticas avançadas
export interface AuditActivityByDate {
  date: string
  total_operations: number
  inserts: number
  updates: number
  deletes: number
}

export interface AuditUserActivity {
  user_id: string
  user_email: string
  total_operations: number
  last_activity: string
  operations_by_type: {
    inserts: number
    updates: number
    deletes: number
  }
  most_active_table: string
}

export interface AuditTableActivity {
  table_name: string
  total_operations: number
  unique_users: number
  last_activity: string
  operations_by_type: {
    inserts: number
    updates: number
    deletes: number
  }
  most_active_user: string | null
}

// Tipos para configurações de auditoria
export interface AuditSettings {
  enabled_tables: string[]
  retention_days: number
  track_user_agent: boolean
  track_ip_address: boolean
  auto_cleanup_enabled: boolean
  notification_settings: {
    email_on_critical_changes: boolean
    webhook_url: string | null
    notification_threshold: number
  }
}

// Enums para facilitar uso
export enum OperationType {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export enum AuditableTable {
  VERSIONS = 'versions',
  MODULES = 'modules',
  CLIENTS = 'clients',
  CARDS = 'cards',
  VERSION_CLIENTS = 'version_clients'
}

// Tipos para exportação de relatórios
export interface AuditReportParams {
  filters: AuditFilters
  format: 'csv' | 'pdf' | 'excel'
  include_details: boolean
  group_by?: 'table' | 'user' | 'date' | 'operation'
  date_range: {
    start: string
    end: string
  }
}

export interface AuditReportData {
  metadata: {
    generated_at: string
    generated_by: string
    total_records: number
    filters_applied: AuditFilters
  }
  summary: {
    total_operations: number
    operations_by_type: Record<OperationType, number>
    operations_by_table: Record<string, number>
    unique_users: number
    date_range: {
      start: string
      end: string
    }
  }
  details: AuditLogWithUserInfo[]
}

// Utility types para formulários
export interface CreateAuditLogRequest {
  table_name: string
  operation_type: OperationType
  record_id: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  description?: string
  tags?: string[]
}

export interface AuditLogFormData {
  description: string
  tags: string[]
}

// Tipos para hooks e contexto
export interface AuditContextValue {
  logs: AuditLogWithUserInfo[]
  stats: AuditStats | null
  filters: AuditFilters
  loading: boolean
  error: string | null
  setFilters: (filters: AuditFilters) => void
  refreshLogs: () => Promise<void>
  exportReport: (params: AuditReportParams) => Promise<string>
}

// Tipos para componentes de UI
export interface AuditLogCardProps {
  log: AuditLogWithUserInfo
  showDetails?: boolean
  onViewDetails?: (log: AuditLogWithUserInfo) => void
  className?: string
}

export interface AuditTimelineProps {
  logs: AuditLogWithUserInfo[]
  maxItems?: number
  showFilters?: boolean
  className?: string
}

export interface AuditStatsCardProps {
  stats: AuditStats
  loading?: boolean
  className?: string
}

// Response types para API
export interface AuditLogsResponse {
  success: boolean
  data: AuditLogWithUserInfo[]
  pagination?: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
  error?: string
}

export interface AuditStatsResponse {
  success: boolean
  data: AuditStats
  error?: string
}

export interface AuditExportResponse {
  success: boolean
  download_url: string
  expires_at: string
  error?: string
}

// Database types extension
export interface DatabaseAudit {
  public: {
    Tables: {
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'timestamp'>
        Update: Partial<Omit<AuditLog, 'id' | 'timestamp'>>
      }
    }
    Views: {
      audit_logs_with_user_info: {
        Row: AuditLogWithUserInfo
      }
      audit_summary_by_table: {
        Row: AuditSummaryByTable
      }
      recent_audit_activity: {
        Row: AuditLogWithUserInfo
      }
    }
    Functions: {
      get_audit_stats: {
        Returns: AuditStats[]
      }
      cleanup_old_audit_logs: {
        Returns: number
      }
    }
  }
}