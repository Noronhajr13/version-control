import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns'

export interface DashboardMetrics {
  totalVersions: number
  totalModules: number
  totalClients: number
  versionsThisMonth: number
  versionsLastMonth: number
  recentVersions: Array<{
    id: string
    version_number: string
    tag: string
    release_date: string
    module: { name: string }
  }>
  versionsByMonth: Array<{
    month: string
    count: number
  }>
  moduleDistribution: Array<{
    module: string
    versions: number
  }>
  clientUsage: Array<{
    client: string
    versions: number
  }>
}

export const useDashboardMetrics = () => {
  const supabase = createClient()

  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async (): Promise<DashboardMetrics> => {
      const now = new Date()
      const currentMonthStart = startOfMonth(now)
      const currentMonthEnd = endOfMonth(now)
      const lastMonthStart = startOfMonth(subMonths(now, 1))
      const lastMonthEnd = endOfMonth(subMonths(now, 1))

      // Buscar dados básicos
      const [
        versionsResult,
        modulesResult,
        clientsResult,
        versionsThisMonthResult,
        versionsLastMonthResult,
        recentVersionsResult
      ] = await Promise.all([
        supabase.from('versions').select('*', { count: 'exact' }),
        supabase.from('modules').select('*', { count: 'exact' }),
        supabase.from('clients').select('*', { count: 'exact' }),
        supabase
          .from('versions')
          .select('*', { count: 'exact' })
          .gte('release_date', format(currentMonthStart, 'yyyy-MM-dd'))
          .lte('release_date', format(currentMonthEnd, 'yyyy-MM-dd')),
        supabase
          .from('versions')
          .select('*', { count: 'exact' })
          .gte('release_date', format(lastMonthStart, 'yyyy-MM-dd'))
          .lte('release_date', format(lastMonthEnd, 'yyyy-MM-dd')),
        supabase
          .from('versions')
          .select(`
            id,
            version_number,
            tag,
            release_date,
            modules:module_id (name)
          `)
          .order('release_date', { ascending: false })
          .limit(5)
      ])

      // Buscar versões dos últimos 6 meses para gráfico
      const sixMonthsAgo = subMonths(now, 6)
      const { data: versionsByMonthData } = await supabase
        .from('versions')
        .select('release_date')
        .gte('release_date', format(sixMonthsAgo, 'yyyy-MM-dd'))
        .order('release_date')

      // Buscar distribuição por módulo
      const { data: moduleDistributionData } = await supabase
        .from('versions')
        .select(`
          modules:module_id (name)
        `)
        .not('module_id', 'is', null)

      // Buscar uso por cliente
      const { data: clientUsageData } = await supabase
        .from('version_clients')
        .select(`
          clients:client_id (name)
        `)

      // Processar dados para gráficos
      const versionsByMonth = []
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(now, i)
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)
        
        const count = versionsByMonthData?.filter(version => {
          const releaseDate = new Date(version.release_date)
          return releaseDate >= monthStart && releaseDate <= monthEnd
        }).length || 0

        versionsByMonth.push({
          month: format(month, 'MMM/yy'),
          count
        })
      }

      // Processar distribuição por módulo
      const moduleCountMap = new Map()
      moduleDistributionData?.forEach(item => {
        const moduleName = (item.modules as any)?.name || 'Sem módulo'
        moduleCountMap.set(moduleName, (moduleCountMap.get(moduleName) || 0) + 1)
      })

      const moduleDistribution = Array.from(moduleCountMap.entries()).map(([module, versions]) => ({
        module,
        versions: versions as number
      }))

      // Processar uso por cliente
      const clientCountMap = new Map()
      clientUsageData?.forEach(item => {
        const clientName = (item.clients as any)?.name || 'Cliente desconhecido'
        clientCountMap.set(clientName, (clientCountMap.get(clientName) || 0) + 1)
      })

      const clientUsage = Array.from(clientCountMap.entries())
        .map(([client, versions]) => ({
          client,
          versions: versions as number
        }))
        .sort((a, b) => b.versions - a.versions)
        .slice(0, 10) // Top 10 clientes

      return {
        totalVersions: versionsResult.count || 0,
        totalModules: modulesResult.count || 0,
        totalClients: clientsResult.count || 0,
        versionsThisMonth: versionsThisMonthResult.count || 0,
        versionsLastMonth: versionsLastMonthResult.count || 0,
        recentVersions: recentVersionsResult.data?.map(version => ({
          id: version.id,
          version_number: version.version_number,
          tag: version.tag,
          release_date: version.release_date,
          module: { name: (version.modules as any)?.name || 'Sem módulo' }
        })) || [],
        versionsByMonth,
        moduleDistribution,
        clientUsage
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}