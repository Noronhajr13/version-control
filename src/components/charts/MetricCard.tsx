'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number
  previousValue?: number
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'purple' | 'orange'
}

export function MetricCard({ title, value, previousValue, icon, color = 'blue' }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  }

  const getTrend = () => {
    if (previousValue === undefined) return null
    
    const change = value - previousValue
    const percentage = previousValue > 0 ? (change / previousValue) * 100 : 0

    if (change > 0) {
      return (
        <div className="flex items-center text-green-600 dark:text-green-400">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">+{percentage.toFixed(0)}%</span>
        </div>
      )
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-600 dark:text-red-400">
          <TrendingDown className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">{percentage.toFixed(0)}%</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center text-gray-500 dark:text-gray-400">
          <Minus className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">0%</span>
        </div>
      )
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {getTrend()}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  )
}