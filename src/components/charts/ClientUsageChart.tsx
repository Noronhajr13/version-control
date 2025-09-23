'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ClientUsageChartProps {
  data: Array<{
    client: string
    versions: number
  }>
}

export function ClientUsageChart({ data }: ClientUsageChartProps) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Top 10 Clientes por Uso
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            type="number"
            tick={{ fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
          />
          <YAxis 
            type="category"
            dataKey="client" 
            tick={{ fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
            width={100}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg)',
              border: '1px solid var(--tooltip-border)',
              borderRadius: '8px',
              color: 'var(--tooltip-text)'
            }}
          />
          <Bar 
            dataKey="versions" 
            fill="#10b981" 
            radius={[0, 4, 4, 0]}
            name="Versões"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}