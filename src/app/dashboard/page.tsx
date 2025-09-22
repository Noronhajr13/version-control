'use client'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Dashboard
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total de Módulos
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            0
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total de Clientes
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            0
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Versões Ativas
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            0
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Cards Jira
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            0
          </p>
        </div>
      </div>
    </div>
  )
}