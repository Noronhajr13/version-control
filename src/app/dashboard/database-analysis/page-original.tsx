'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';

export default function DatabaseAnalysisPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const analyzeVersionClients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Testar query simples na tabela version_clients
      const { data: versionClients, error: vcError } = await supabase
        .from('version_clients')
        .select('*')
        .limit(5);

      if (vcError) {
        throw new Error(`Erro version_clients: ${vcError.message}`);
      }

      // Testar query na tabela clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .limit(5);

      if (clientsError) {
        throw new Error(`Erro clients: ${clientsError.message}`);
      }

      // Testar query na tabela versions
      const { data: versions, error: versionsError } = await supabase
        .from('versions')
        .select('*')
        .limit(5);

      if (versionsError) {
        throw new Error(`Erro versions: ${versionsError.message}`);
      }

      // Testar query com JOIN
      const { data: joinData, error: joinError } = await supabase
        .from('version_clients')
        .select(`
          id,
          version_id,
          client_id,
          versions(id, version_number, tag),
          clients(id, name, uf)
        `)
        .limit(3);

      setResults({
        versionClients,
        clients,
        versions,
        joinData,
        joinError: joinError?.message || null
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Análise do Banco de Dados
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Teste das queries e estrutura das tabelas
        </p>
      </div>

      <div className="mb-6">
        <Button onClick={analyzeVersionClients} disabled={loading}>
          {loading ? 'Analisando...' : 'Testar Queries'}
        </Button>
      </div>

      {error && (
        <Card className="p-6 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
            Erro
          </h2>
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </Card>
      )}

      {results && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Resultados da Análise</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">1. Tabela version_clients (5 registros):</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(results.versionClients, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-medium mb-2">2. Tabela clients (5 registros):</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(results.clients, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-medium mb-2">3. Tabela versions (5 registros):</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(results.versions, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-medium mb-2">4. Query com JOIN (3 registros):</h3>
                {results.joinError && (
                  <p className="text-red-600 mb-2">Erro no JOIN: {results.joinError}</p>
                )}
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(results.joinData, null, 2)}
                </pre>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">🔍 Análise dos Campos</h2>
            
            {results.versionClients && results.versionClients.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Campos disponíveis em version_clients:</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(results.versionClients[0]).map((field: string) => (
                    <span 
                      key={field}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {results.clients && results.clients.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Campos disponíveis em clients:</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(results.clients[0]).map((field: string) => (
                    <span 
                      key={field}
                      className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {results.versions && results.versions.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Campos disponíveis em versions:</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(results.versions[0]).map((field: string) => (
                    <span 
                      key={field}
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}