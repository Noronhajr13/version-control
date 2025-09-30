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

  const analyzeDatabase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Testar query simples na tabela version_clients
      console.log('Testando version_clients...');
      const { data: versionClients, error: vcError } = await supabase
        .from('version_clients')
        .select('*')
        .limit(3);

      console.log('version_clients result:', { versionClients, vcError });

      // Testar query na tabela clients
      console.log('Testando clients...');
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .limit(3);

      console.log('clients result:', { clients, clientsError });

      // Testar query na tabela versions
      console.log('Testando versions...');
      const { data: versions, error: versionsError } = await supabase
        .from('versions')
        .select('*')
        .limit(3);

      console.log('versions result:', { versions, versionsError });

      // Testar query com JOIN como na página de clientes
      console.log('Testando JOIN...');
      const { data: joinData, error: joinError } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          uf,
          version_clients(
            id,
            version_id,
            client_id,
            versions(
              id,
              version_number,
              tag,
              release_date,
              file_path,
              modules(name)
            )
          )
        `)
        .limit(2);

      console.log('JOIN result:', { joinData, joinError });

      setResults({
        versionClients: versionClients || [],
        clients: clients || [],
        versions: versions || [],
        joinData: joinData || [],
        errors: {
          versionClients: vcError?.message || null,
          clients: clientsError?.message || null,
          versions: versionsError?.message || null,
          join: joinError?.message || null
        }
      });

    } catch (err: any) {
      console.error('Erro geral:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🔍 Análise do Banco de Dados
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Teste das queries e estrutura das tabelas do Supabase
        </p>
      </div>

      <div className="mb-6 flex gap-4">
        <Button onClick={analyzeDatabase} disabled={loading}>
          {loading ? '🔄 Analisando...' : '🚀 Executar Análise'}
        </Button>
        
        <Button 
          onClick={() => window.open('http://localhost:3002/dashboard/clients', '_blank')}
          variant="outline"
        >
          🔗 Testar Página Clientes
        </Button>
      </div>

      {error && (
        <Card className="p-6 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
            ❌ Erro Geral
          </h2>
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </Card>
      )}

      {results && (
        <div className="space-y-6">
          {/* Resumo dos Erros */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">🚨 Status das Queries</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-3 rounded-lg text-center ${results.errors.versionClients ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                <div className="font-semibold">version_clients</div>
                <div className="text-sm">{results.errors.versionClients || '✅ OK'}</div>
              </div>
              <div className={`p-3 rounded-lg text-center ${results.errors.clients ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                <div className="font-semibold">clients</div>
                <div className="text-sm">{results.errors.clients || '✅ OK'}</div>
              </div>
              <div className={`p-3 rounded-lg text-center ${results.errors.versions ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                <div className="font-semibold">versions</div>
                <div className="text-sm">{results.errors.versions || '✅ OK'}</div>
              </div>
              <div className={`p-3 rounded-lg text-center ${results.errors.join ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                <div className="font-semibold">JOIN Query</div>
                <div className="text-sm">{results.errors.join || '✅ OK'}</div>
              </div>
            </div>
          </Card>

          {/* Dados das Tabelas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">📊 version_clients</h3>
              <div className="text-sm text-gray-600 mb-2">
                Registros encontrados: {results.versionClients.length}
              </div>
              {results.versionClients.length > 0 && (
                <div>
                  <div className="mb-2">
                    <strong>Campos disponíveis:</strong>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {Object.keys(results.versionClients[0]).map((field: string) => (
                      <span 
                        key={field}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto max-h-40">
                    {JSON.stringify(results.versionClients, null, 2)}
                  </pre>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">👥 clients</h3>
              <div className="text-sm text-gray-600 mb-2">
                Registros encontrados: {results.clients.length}
              </div>
              {results.clients.length > 0 && (
                <div>
                  <div className="mb-2">
                    <strong>Campos disponíveis:</strong>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {Object.keys(results.clients[0]).map((field: string) => (
                      <span 
                        key={field}
                        className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto max-h-40">
                    {JSON.stringify(results.clients, null, 2)}
                  </pre>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">📦 versions</h3>
              <div className="text-sm text-gray-600 mb-2">
                Registros encontrados: {results.versions.length}
              </div>
              {results.versions.length > 0 && (
                <div>
                  <div className="mb-2">
                    <strong>Campos disponíveis:</strong>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {Object.keys(results.versions[0]).map((field: string) => (
                      <span 
                        key={field}
                        className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto max-h-40">
                    {JSON.stringify(results.versions, null, 2)}
                  </pre>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">🔗 JOIN Query (Clientes)</h3>
              <div className="text-sm text-gray-600 mb-2">
                Resultado do JOIN: {results.joinData.length} registros
              </div>
              {results.errors.join && (
                <div className="mb-3 p-2 bg-red-100 text-red-800 rounded text-sm">
                  ❌ {results.errors.join}
                </div>
              )}
              <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto max-h-40">
                {JSON.stringify(results.joinData, null, 2)}
              </pre>
            </Card>
          </div>

          {/* Conclusões */}
          <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <h2 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-200">
              📝 Conclusões da Análise
            </h2>
            <div className="space-y-2 text-sm">
              <div>✅ Tabelas existem e são acessíveis</div>
              <div>🔍 Estrutura dos campos foi mapeada</div>
              <div>🔗 Query JOIN testada (mesma usada na página de clientes)</div>
              <div>💡 Use os dados acima para corrigir queries problemáticas</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}