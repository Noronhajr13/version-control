'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';

interface TableStructure {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string;
}

interface TableInfo {
  table_name: string;
  table_type: string;
}

export default function DatabaseAnalysisPage() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const analyzeDatabase = async () => {
    setLoading(true);
    
    try {
      const results: any = {};

      // 1. Listar todas as tabelas
      const { data: tables } = await supabase
        .rpc('sql', { 
          query: `
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
          `
        }) as { data: TableInfo[] };
      
      results.tables = tables || [];

      // 2. Analisar estrutura das tabelas principais
      const tablesToAnalyze = ['clients', 'versions', 'version_clients', 'modules'];
      
      for (const tableName of tablesToAnalyze) {
        try {
          const { data: structure } = await supabase
            .rpc('sql', {
              query: `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = '${tableName}' AND table_schema = 'public'
                ORDER BY ordinal_position
              `
            }) as { data: TableStructure[] };
          
          results[tableName] = structure || [];
        } catch (error) {
          console.log(`Tabela ${tableName} não encontrada ou erro:`, error);
          results[tableName] = [];
        }
      }

      // 3. Sample data das tabelas
      try {
        const { data: sampleVersionClients } = await supabase
          .from('version_clients')
          .select('*')
          .limit(3);
        results.sampleVersionClients = sampleVersionClients || [];
      } catch (error) {
        results.sampleVersionClients = [];
      }

      try {
        const { data: sampleClients } = await supabase
          .from('clients')
          .select('*')
          .limit(3);
        results.sampleClients = sampleClients || [];
      } catch (error) {
        results.sampleClients = [];
      }

      setAnalysis(results);
      
    } catch (error) {
      console.error('Erro na análise:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Análise da Estrutura do Banco
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Análise completa das tabelas e relacionamentos
        </p>
      </div>

      <div className="mb-6">
        <Button onClick={analyzeDatabase} disabled={loading}>
          {loading ? 'Analisando...' : 'Executar Análise'}
        </Button>
      </div>

      {analysis && (
        <div className="space-y-6">
          {/* Tabelas Existentes */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Tabelas no Schema Public</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {analysis.tables?.map((table: TableInfo, index: number) => (
                <div key={index} className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  {table.table_name} ({table.table_type})
                </div>
              ))}
            </div>
          </Card>

          {/* Estrutura das Tabelas Principais */}
          {['clients', 'versions', 'version_clients', 'modules'].map(tableName => (
            <Card key={tableName} className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                🔧 Estrutura da Tabela: {tableName}
              </h2>
              {analysis[tableName]?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Coluna
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Tipo
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Nullable
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Default
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {analysis[tableName].map((col: TableStructure, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm font-medium">
                            {col.column_name}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {col.data_type}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {col.is_nullable}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {col.column_default || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">Tabela não encontrada ou sem colunas</p>
              )}
            </Card>
          ))}

          {/* Sample Data */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">📋 Dados de Exemplo</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">version_clients:</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(analysis.sampleVersionClients, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">clients:</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(analysis.sampleClients, null, 2)}
                </pre>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}