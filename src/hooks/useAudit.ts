// =====================================================
// SISTEMA DE AUDITORIA - HOOKS PERSONALIZADOS
// Data: 2025-09-23
// Descrição: Hooks para gerenciar dados de auditoria
// =====================================================

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from './useSupabase'
import type { 
  AuditLogWithUserInfo, 
  AuditStats, 
  AuditFilters, 
  AuditPaginationParams,
  AuditPaginatedResponse
} from '@/src/lib/types/audit'

// Hook para buscar logs de auditoria com filtros
export function useAuditLogs(
  filters: AuditFilters = {},
  pagination: AuditPaginationParams = {}
) {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: ['audit-logs', filters, pagination],
    queryFn: async (): Promise<AuditPaginatedResponse> => {
      let query = supabase
        .from('audit_logs_with_user_info')
        .select('*', { count: 'exact' })
      
      // Aplicar filtros
      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name)
      }
      
      if (filters.operation_type) {
        query = query.eq('operation_type', filters.operation_type)
      }
      
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }
      
      if (filters.user_email) {
        query = query.ilike('user_email', `%${filters.user_email}%`)
      }
      
      if (filters.record_id) {
        query = query.eq('record_id', filters.record_id)
      }
      
      if (filters.date_from) {
        query = query.gte('timestamp', filters.date_from)
      }
      
      if (filters.date_to) {
        query = query.lte('timestamp', filters.date_to)
      }
      
      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,user_email.ilike.%${filters.search}%`)
      }
      
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }
      
      // Aplicar ordenação
      const sortBy = pagination.sort_by || 'timestamp'
      const sortOrder = pagination.sort_order || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
      
      // Aplicar paginação
      const page = pagination.page || 1
      const perPage = pagination.per_page || 20
      const from = (page - 1) * perPage
      const to = from + perPage - 1
      
      query = query.range(from, to)
      
      const { data, error, count } = await query
      
      if (error) throw error
      
      const totalPages = Math.ceil((count || 0) / perPage)
      
      return {
        data: data || [],
        pagination: {
          page,
          per_page: perPage,
          total: count || 0,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

// Hook para estatísticas de auditoria
export function useAuditStats() {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: ['audit-stats'],
    queryFn: async (): Promise<AuditStats> => {
      const { data, error } = await supabase.rpc('get_audit_stats')
      
      if (error) throw error
      
      // A função retorna array, pegar o primeiro item
      return data?.[0] || {
        total_logs: 0,
        logs_last_7_days: 0,
        logs_last_30_days: 0,
        most_active_table: '',
        most_active_user: ''
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para atividade recente
export function useRecentAuditActivity(limit = 10) {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: ['recent-audit-activity', limit],
    queryFn: async (): Promise<AuditLogWithUserInfo[]> => {
      const { data, error } = await supabase
        .from('recent_audit_activity')
        .select('*')
        .limit(limit)
      
      if (error) throw error
      
      return data || []
    },
    staleTime: 1000 * 30, // 30 segundos
  })
}

// Hook para resumo por tabela
export function useAuditSummaryByTable() {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: ['audit-summary-by-table'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_summary_by_table')
        .select('*')
        .order('operation_count', { ascending: false })
      
      if (error) throw error
      
      return data || []
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}

// Hook para logs de um registro específico
export function useRecordAuditHistory(recordId: string, tableName: string) {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: ['record-audit-history', recordId, tableName],
    queryFn: async (): Promise<AuditLogWithUserInfo[]> => {
      const { data, error } = await supabase
        .from('audit_logs_with_user_info')
        .select('*')
        .eq('record_id', recordId)
        .eq('table_name', tableName)
        .order('timestamp', { ascending: false })
      
      if (error) throw error
      
      return data || []
    },
    enabled: !!recordId && !!tableName,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

// Hook para criar log manual de auditoria
export function useCreateAuditLog() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (logData: {
      table_name: string
      operation_type: 'INSERT' | 'UPDATE' | 'DELETE'
      record_id: string
      description?: string
      old_values?: Record<string, any>
      new_values?: Record<string, any>
      tags?: string[]
    }) => {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert([{
          ...logData,
          changed_fields: logData.old_values && logData.new_values 
            ? Object.keys(logData.new_values).filter(key => 
                JSON.stringify(logData.old_values![key]) !== JSON.stringify(logData.new_values![key])
              )
            : ['*']
        }])
        .select()
      
      if (error) throw error
      
      return data?.[0]
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a auditoria
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      queryClient.invalidateQueries({ queryKey: ['audit-stats'] })
      queryClient.invalidateQueries({ queryKey: ['recent-audit-activity'] })
      queryClient.invalidateQueries({ queryKey: ['audit-summary-by-table'] })
    },
  })
}

// Hook para limpeza de logs antigos
export function useCleanupOldAuditLogs() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('cleanup_old_audit_logs')
      
      if (error) throw error
      
      return data || 0
    },
    onSuccess: () => {
      // Invalidar queries após limpeza
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      queryClient.invalidateQueries({ queryKey: ['audit-stats'] })
      queryClient.invalidateQueries({ queryKey: ['audit-summary-by-table'] })
    },
  })
}

// Hook para buscar logs de um usuário específico
export function useUserAuditLogs(userId: string, days = 30) {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: ['user-audit-logs', userId, days],
    queryFn: async (): Promise<AuditLogWithUserInfo[]> => {
      const { data, error } = await supabase
        .from('audit_logs_with_user_info')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })
      
      if (error) throw error
      
      return data || []
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para estatísticas de atividade por período
export function useAuditActivityStats(days = 7) {
  const supabase = useSupabase()
  
  return useQuery({
    queryKey: ['audit-activity-stats', days],
    queryFn: async () => {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('operation_type, timestamp, table_name')
        .gte('timestamp', startDate)
        .order('timestamp', { ascending: true })
      
      if (error) throw error
      
      // Processar dados para estatísticas
      const dailyStats = data?.reduce((acc, log) => {
        const date = new Date(log.timestamp).toDateString()
        
        if (!acc[date]) {
          acc[date] = {
            date,
            total_operations: 0,
            inserts: 0,
            updates: 0,
            deletes: 0
          }
        }
        
        acc[date].total_operations++
        acc[date][log.operation_type.toLowerCase() + 's']++
        
        return acc
      }, {} as Record<string, any>) || {}
      
      return Object.values(dailyStats)
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook combinado para dashboard de auditoria
export function useAuditDashboard() {
  const stats = useAuditStats()
  const recentActivity = useRecentAuditActivity(5)
  const summaryByTable = useAuditSummaryByTable()
  const activityStats = useAuditActivityStats(7)
  
  return {
    stats: stats.data,
    recentActivity: recentActivity.data || [],
    summaryByTable: summaryByTable.data || [],
    activityStats: activityStats.data || [],
    loading: stats.isLoading || recentActivity.isLoading || summaryByTable.isLoading || activityStats.isLoading,
    error: stats.error || recentActivity.error || summaryByTable.error || activityStats.error,
    refetch: () => {
      stats.refetch()
      recentActivity.refetch()
      summaryByTable.refetch()
      activityStats.refetch()
    }
  }
}