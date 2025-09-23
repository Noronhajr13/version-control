'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { Button } from '@/src/components/ui/Button'
import { Input } from '@/src/components/ui/Input'
import { EmptyState } from '@/src/components/ui/EmptyState'
import { useAuditLogs, useAuditStats, useAuditDashboard } from '@/src/hooks/useAudit'
import type { AuditFilters } from '@/src/lib/types/audit'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Activity, 
  Users, 
  Database, 
  TrendingUp,
  Calendar,
  User,
  FileText,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'

export default function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({ page: 1, per_page: 20 })
  
  const { data: auditData, isLoading, error } = useAuditLogs(
    { ...filters, search: searchTerm },
    pagination
  )
  
  const dashboard = useAuditDashboard()

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT': return <Plus className="h-4 w-4 text-green-500" />
      case 'UPDATE': return <Edit className="h-4 w-4 text-blue-500" />
      case 'DELETE': return <Trash2 className="h-4 w-4 text-red-500" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'INSERT': return 'bg-green-50 text-green-700 border-green-200'
      case 'UPDATE': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'DELETE': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const formatTableName = (tableName: string) => {
    const tableMap: Record<string, string> = {
      'versions': 'Versões',
      'modules': 'Módulos',
      'clients': 'Clientes',
      'cards': 'Cards',
      'version_clients': 'Versão-Clientes'
    }
    return tableMap[tableName] || tableName
  }

  const formatChangedFields = (fields: string[]) => {
    if (fields.includes('*')) return 'Todos os campos'
    return fields.join(', ')
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <Activity className="h-5 w-5" />
              <span>Erro ao carregar logs de auditoria: {error.message}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Auditoria</h1>
          <p className="text-gray-600 mt-1">
            Rastreamento completo de todas as alterações no sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {dashboard.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Logs</p>
                  <p className="text-2xl font-bold">{dashboard.stats.total_logs.toLocaleString()}</p>
                </div>
                <History className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Últimos 7 dias</p>
                  <p className="text-2xl font-bold">{dashboard.stats.logs_last_7_days.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tabela Mais Ativa</p>
                  <p className="text-lg font-bold">{formatTableName(dashboard.stats.most_active_table)}</p>
                </div>
                <Database className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuário Mais Ativo</p>
                  <p className="text-sm font-bold truncate">{dashboard.stats.most_active_user || 'N/A'}</p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por descrição, usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.table_name || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, table_name: e.target.value || undefined }))}
            >
              <option value="">Todas as tabelas</option>
              <option value="versions">Versões</option>
              <option value="modules">Módulos</option>
              <option value="clients">Clientes</option>
              <option value="cards">Cards</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.operation_type || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, operation_type: e.target.value as any || undefined }))}
            >
              <option value="">Todas as operações</option>
              <option value="INSERT">Criação</option>
              <option value="UPDATE">Atualização</option>
              <option value="DELETE">Exclusão</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Logs de Auditoria
          </CardTitle>
          <CardDescription>
            {auditData?.pagination.total || 0} registros encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : auditData?.data.length === 0 ? (
            <EmptyState
              icon={<History className="h-12 w-12 text-gray-400" />}
              title="Nenhum log encontrado"
              description="Não há logs de auditoria que correspondam aos filtros aplicados."
            />
          ) : (
            <div className="space-y-4">
              {auditData?.data.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getOperationIcon(log.operation_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getOperationColor(log.operation_type)}>
                          {log.operation_type}
                        </Badge>
                        <Badge variant="outline">
                          {formatTableName(log.table_name)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-900 mb-1">
                        {log.description || `${log.operation_type} em ${formatTableName(log.table_name)}`}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{log.user_display_email || log.user_email || 'Sistema'}</span>
                        </div>
                        
                        {log.changed_fields && log.changed_fields.length > 0 && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>Campos: {formatChangedFields(log.changed_fields)}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>ID: {log.record_id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {auditData && auditData.pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Mostrando {(auditData.pagination.page - 1) * auditData.pagination.per_page + 1} a{' '}
                {Math.min(auditData.pagination.page * auditData.pagination.per_page, auditData.pagination.total)} de{' '}
                {auditData.pagination.total} registros
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!auditData.pagination.has_prev}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!auditData.pagination.has_next}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}