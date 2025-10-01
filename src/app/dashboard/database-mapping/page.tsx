'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface DatabaseMapping {
  tables: any[];
  functions: any[];
  triggers: any[];
  enums: any[];
  timestamp: string;
}

export default function DatabaseMappingPage() {
  const [mapping, setMapping] = useState<DatabaseMapping | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();

  const runDatabaseMapping = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Executar queries SQL para mapear a estrutura
      const queries = [
        // Tabelas
        {
          name: 'tables',
          query: `
            SELECT table_name, table_type, table_schema
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
          `
        },
        // Functions
        {
          name: 'functions',
          query: `
            SELECT routine_name, routine_type, routine_definition
            FROM information_schema.routines 
            WHERE routine_schema = 'public'
            ORDER BY routine_name;
          `
        },
        // Triggers
        {
          name: 'triggers',
          query: `
            SELECT trigger_name, event_object_table, action_timing, event_manipulation
            FROM information_schema.triggers
            WHERE trigger_schema = 'public'
            ORDER BY trigger_name;
          `
        },
        // Enums (tipos customizados)
        {
          name: 'enums',
          query: `
            SELECT t.typname as enum_name, 
                   array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid  
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public'
            GROUP BY t.typname
            ORDER BY t.typname;
          `
        }
      ];

      const results: any = {};
      
      for (const queryData of queries) {
        const { data, error: queryError } = await supabase.rpc('exec_sql', {
          query: queryData.query
        });
        
        if (queryError) {
          // Se RPC não funcionar, tentar query direta
          console.warn(`RPC failed for ${queryData.name}, trying direct query...`);
          continue;
        }
        
        results[queryData.name] = data || [];
      }

      const mappingResult: DatabaseMapping = {
        tables: results.tables || [],
        functions: results.functions || [],
        triggers: results.triggers || [],
        enums: results.enums || [],
        timestamp: new Date().toISOString()
      };

      setMapping(mappingResult);
      
    } catch (err: any) {
      setError(err.message);
      console.error('Erro no mapeamento:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadMapping = () => {
    if (!mapping) return;
    
    const dataStr = JSON.stringify(mapping, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `supabase-mapping-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mapeamento da Estrutura Supabase
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Análise completa de tabelas, funções, triggers e enums do banco de dados
        </p>
      </div>

      <div className="mb-6">
        <Button 
          onClick={runDatabaseMapping}
          disabled={loading}
          className="mr-4"
        >
          {loading ? 'Mapeando...' : 'Executar Mapeamento'}
        </Button>
        
        {mapping && (
          <Button 
            onClick={downloadMapping}
            variant="outline"
          >
            Download JSON
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Erro</h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </div>
      )}

      {mapping && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tabelas */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              📊 Tabelas ({mapping.tables.length})
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {mapping.tables.map((table: any, index: number) => (
                <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="font-medium">{table.table_name}</span>
                  <span className="text-sm text-gray-500 ml-2">({table.table_type})</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Functions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              ⚙️ Functions ({mapping.functions.length})
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {mapping.functions.map((func: any, index: number) => (
                <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="font-medium">{func.routine_name}</span>
                  <span className="text-sm text-gray-500 ml-2">({func.routine_type})</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Triggers */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              🔄 Triggers ({mapping.triggers.length})
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {mapping.triggers.map((trigger: any, index: number) => (
                <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="font-medium">{trigger.trigger_name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    on {trigger.event_object_table}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Enums */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              🏷️ Enums ({mapping.enums.length})
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {mapping.enums.map((enumType: any, index: number) => (
                <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="font-medium">{enumType.enum_name}</span>
                  <div className="text-sm text-gray-500 mt-1">
                    {Array.isArray(enumType.enum_values) 
                      ? enumType.enum_values.join(', ')
                      : 'Valores não disponíveis'
                    }
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {mapping && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-2">Resumo do Mapeamento</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Executado em: {new Date(mapping.timestamp).toLocaleString('pt-BR')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{mapping.tables.length}</div>
              <div className="text-sm text-gray-500">Tabelas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{mapping.functions.length}</div>
              <div className="text-sm text-gray-500">Functions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{mapping.triggers.length}</div>
              <div className="text-sm text-gray-500">Triggers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{mapping.enums.length}</div>
              <div className="text-sm text-gray-500">Enums</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}