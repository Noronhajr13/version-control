'use client'

import { useState, useEffect } from 'react'

export default function MigrationPage() {
  const [status, setStatus] = useState('Carregando...')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const executeCommand = async (command: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResults(prev => [...prev, ...data.results])
        setStatus(`Comando ${command} executado`)
      } else {
        setStatus(`Erro: ${data.error}`)
      }
    } catch (error) {
      setStatus(`Erro na requisição: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    executeCommand('check_tables')
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔄 Painel de Migração</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">📊 Status</h2>
        <p className="text-lg mb-4">
          <strong>Status:</strong> {status}
        </p>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => executeCommand('check_tables')}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : '🔍 Verificar Tabelas'}
          </button>
          
          <button
            onClick={() => executeCommand('check_data')}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : '� Verificar Dados'}
          </button>
          
          <button
            onClick={() => executeCommand('check_auth_users')}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : '🔐 Verificar Auth'}
          </button>
          
          <button
            onClick={() => executeCommand('create_admin')}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : '👑 Criar Admin'}
          </button>
          
          <button
            onClick={() => setResults([])}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            🧹 Limpar
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">📋 Resultados</h2>
        {results.length === 0 ? (
          <p className="text-gray-600">Nenhum resultado ainda. Execute um comando acima.</p>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700'
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700'
                }`}
              >
                <h3 className="font-semibold mb-2">
                  {result.success ? '✅' : '❌'} {result.action}
                </h3>
                
                {result.error && (
                  <p className="text-red-600 mb-2">
                    <strong>Erro:</strong> {result.error}
                  </p>
                )}
                
                {result.data && (
                  <div className="mt-2">
                    <details className="cursor-pointer">
                      <summary className="font-medium">Dados ({Array.isArray(result.data) ? result.data.length : 1} itens)</summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}