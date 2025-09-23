'use client'

import { Package, Users, GitBranch, Folder } from 'lucide-react'
import { useDashboardMetrics } from '@/src/lib/react-query/hooks/useDashboardMetrics'
import { MetricCard } from '@/src/components/charts/MetricCard'
import { VersionsByMonthChart } from '@/src/components/charts/VersionsByMonthChart'
import { ModuleDistributionChart } from '@/src/components/charts/ModuleDistributionChart'
import { ClientUsageChart } from '@/src/components/charts/ClientUsageChart'
import { RecentVersions } from '@/src/components/charts/RecentVersions'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const { data: metrics, isLoading, error } = useDashboardMetrics()

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Dashboard
        </h1>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 p-6 rounded-lg h-32"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 p-6 rounded-lg h-80"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Dashboard
        </h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            Erro ao carregar dados do dashboard. Tente novamente.
          </p>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Dashboard
      </h1>
      
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total de Versões"
          value={metrics.totalVersions}
          previousValue={metrics.totalVersions - metrics.versionsThisMonth}
          icon={<Package className="w-6 h-6" />}
          color="blue"
        />
        
        <MetricCard
          title="Total de Módulos"
          value={metrics.totalModules}
          icon={<Folder className="w-6 h-6" />}
          color="green"
        />
        
        <MetricCard
          title="Total de Clientes"
          value={metrics.totalClients}
          icon={<Users className="w-6 h-6" />}
          color="purple"
        />
        
        <MetricCard
          title="Versões Este Mês"
          value={metrics.versionsThisMonth}
          previousValue={metrics.versionsLastMonth}
          icon={<GitBranch className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <VersionsByMonthChart data={metrics.versionsByMonth} />
        <ModuleDistributionChart data={metrics.moduleDistribution} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClientUsageChart data={metrics.clientUsage} />
        <RecentVersions versions={metrics.recentVersions} />
      </div>
    </div>
  )
}