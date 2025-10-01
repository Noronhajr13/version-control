'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

interface DiagnosticResult {
  step: string
  success: boolean
  message: string
  data?: any
  error?: string
}

export default function DatabaseSetupPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState('')

  const supabase = createClient()

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result])
  }

  const runFullSetup = async () => {
    setLoading(true)
    setResults([])
    
    try {
      // Passo 1: Verificar conexão
      setCurrentStep('Verificando conexão com Supabase...')
      await testConnection()
      
      // Passo 2: Verificar/Criar tabelas
      setCurrentStep('Verificando estrutura das tabelas...')
      await checkAndCreateTables()
      
      // Passo 3: Verificar/Criar funções
      setCurrentStep('Verificando funções do banco...')
      await checkAndCreateFunctions()
      
      // Passo 4: Verificar/Criar policies RLS
      setCurrentStep('Verificando políticas de segurança...')
      await checkAndCreatePolicies()
      
      // Passo 5: Criar usuário admin inicial
      setCurrentStep('Configurando usuário administrador...')
      await createAdminUser()
      
      // Passo 6: Teste final
      setCurrentStep('Executando teste final...')
      await finalTest()
      
    } catch (error) {
      addResult({
        step: currentStep,
        success: false,
        message: 'Erro durante o setup',
        error: error instanceof Error ? error.message : String(error)
      })
    }
    
    setLoading(false)
    setCurrentStep('Concluído!')
  }

  const testConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(1)
      
      if (error) throw error
      
      addResult({
        step: '1. Conexão',
        success: true,
        message: 'Conexão com Supabase estabelecida com sucesso'
      })
    } catch (error) {
      addResult({
        step: '1. Conexão',
        success: false,
        message: 'Falha na conexão com Supabase',
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  const checkAndCreateTables = async () => {
    const tables = [
      {
        name: 'user_profiles',
        sql: `
          CREATE TABLE IF NOT EXISTS user_profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT NOT NULL UNIQUE,
            display_name TEXT,
            role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'manager', 'editor', 'viewer')),
            department TEXT,
            avatar_url TEXT,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id),
            last_login_at TIMESTAMPTZ
          );
        `
      },
      {
        name: 'modules',
        sql: `
          CREATE TABLE IF NOT EXISTS modules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            tags TEXT[],
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id)
          );
        `
      },
      {
        name: 'clients',
        sql: `
          CREATE TABLE IF NOT EXISTS clients (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            uf TEXT NOT NULL CHECK (length(uf) = 2),
            address TEXT,
            city TEXT,
            zip_code TEXT,
            contact_person TEXT,
            notes TEXT,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id)
          );
        `
      },
      {
        name: 'versions',
        sql: `
          CREATE TABLE IF NOT EXISTS versions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
            tag TEXT NOT NULL,
            jira_card TEXT,
            themes_folder TEXT,
            version_number TEXT NOT NULL,
            release_date DATE,
            scripts TEXT,
            powerbuilder_version TEXT,
            file_path TEXT,
            status TEXT DEFAULT 'interna' CHECK (status IN ('interna', 'teste', 'homologacao', 'producao', 'deprecated')),
            description TEXT,
            data_generation TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id),
            UNIQUE(module_id, version_number)
          );
        `
      },
      {
        name: 'version_clients',
        sql: `
          CREATE TABLE IF NOT EXISTS version_clients (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
            client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
            installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            installed_by UUID REFERENCES auth.users(id),
            notes TEXT,
            UNIQUE(version_id, client_id)
          );
        `
      },
      {
        name: 'cards',
        sql: `
          CREATE TABLE IF NOT EXISTS cards (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
            jira_number TEXT NOT NULL,
            last_update DATE NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `
      }
    ]

    for (const table of tables) {
      try {
        // Verificar se tabela existe
        const { data: tableExists } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', table.name)
          .single()

        if (!tableExists) {
          // Criar tabela
          const { error } = await supabase.rpc('sql', { query: table.sql })
          
          if (error) throw error
          
          addResult({
            step: `2. Tabela ${table.name}`,
            success: true,
            message: `Tabela ${table.name} criada com sucesso`
          })
        } else {
          addResult({
            step: `2. Tabela ${table.name}`,
            success: true,
            message: `Tabela ${table.name} já existe`
          })
        }
      } catch (error) {
        addResult({
          step: `2. Tabela ${table.name}`,
          success: false,
          message: `Erro ao verificar/criar tabela ${table.name}`,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
  }

  const checkAndCreateFunctions = async () => {
    const functions = [
      {
        name: 'update_updated_at_column',
        sql: `
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `
      },
      {
        name: 'create_user_profile_trigger',
        sql: `
          CREATE OR REPLACE FUNCTION handle_new_user()
          RETURNS TRIGGER AS $$
          BEGIN
            INSERT INTO public.user_profiles (id, email, display_name, role)
            VALUES (
              NEW.id, 
              NEW.email, 
              COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
              'viewer'
            );
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      }
    ]

    for (const func of functions) {
      try {
        const { error } = await supabase.rpc('sql', { query: func.sql })
        
        if (error) throw error
        
        addResult({
          step: `3. Função ${func.name}`,
          success: true,
          message: `Função ${func.name} criada/atualizada com sucesso`
        })
      } catch (error) {
        addResult({
          step: `3. Função ${func.name}`,
          success: false,
          message: `Erro ao criar função ${func.name}`,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // Criar triggers
    const triggers = [
      {
        name: 'trigger_updated_at_user_profiles',
        sql: `
          DROP TRIGGER IF EXISTS trigger_updated_at_user_profiles ON user_profiles;
          CREATE TRIGGER trigger_updated_at_user_profiles
            BEFORE UPDATE ON user_profiles
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `
      },
      {
        name: 'trigger_updated_at_modules',
        sql: `
          DROP TRIGGER IF EXISTS trigger_updated_at_modules ON modules;
          CREATE TRIGGER trigger_updated_at_modules
            BEFORE UPDATE ON modules
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `
      },
      {
        name: 'trigger_updated_at_clients',
        sql: `
          DROP TRIGGER IF EXISTS trigger_updated_at_clients ON clients;
          CREATE TRIGGER trigger_updated_at_clients
            BEFORE UPDATE ON clients
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `
      },
      {
        name: 'trigger_updated_at_versions',
        sql: `
          DROP TRIGGER IF EXISTS trigger_updated_at_versions ON versions;
          CREATE TRIGGER trigger_updated_at_versions
            BEFORE UPDATE ON versions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `
      },
      {
        name: 'trigger_new_user_profile',
        sql: `
          DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
          CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION handle_new_user();
        `
      }
    ]

    for (const trigger of triggers) {
      try {
        const { error } = await supabase.rpc('sql', { query: trigger.sql })
        
        if (error) throw error
        
        addResult({
          step: `3. Trigger ${trigger.name}`,
          success: true,
          message: `Trigger ${trigger.name} criado/atualizado com sucesso`
        })
      } catch (error) {
        addResult({
          step: `3. Trigger ${trigger.name}`,
          success: false,
          message: `Erro ao criar trigger ${trigger.name}`,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
  }

  const checkAndCreatePolicies = async () => {
    const policies = [
      {
        name: 'Enable read access for authenticated users on user_profiles',
        sql: `
          DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
          CREATE POLICY "Enable read access for authenticated users" ON user_profiles
            FOR SELECT USING (auth.role() = 'authenticated');
        `
      },
      {
        name: 'Enable insert for authenticated users on user_profiles',
        sql: `
          DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
          CREATE POLICY "Enable insert for authenticated users" ON user_profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
        `
      },
      {
        name: 'Enable update for users based on id on user_profiles',
        sql: `
          DROP POLICY IF EXISTS "Enable update for users based on id" ON user_profiles;
          CREATE POLICY "Enable update for users based on id" ON user_profiles
            FOR UPDATE USING (auth.uid() = id);
        `
      }
    ]

    // Primeiro, habilitar RLS nas tabelas
    const tables = ['user_profiles', 'modules', 'clients', 'versions', 'version_clients', 'cards']
    
    for (const table of tables) {
      try {
        const { error } = await supabase.rpc('sql', { 
          query: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;` 
        })
        
        if (error && !error.message.includes('already exists')) {
          throw error
        }
        
        addResult({
          step: `4. RLS ${table}`,
          success: true,
          message: `RLS habilitado para tabela ${table}`
        })
      } catch (error) {
        addResult({
          step: `4. RLS ${table}`,
          success: false,
          message: `Erro ao habilitar RLS para ${table}`,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // Depois, criar as políticas
    for (const policy of policies) {
      try {
        const { error } = await supabase.rpc('sql', { query: policy.sql })
        
        if (error) throw error
        
        addResult({
          step: `4. Policy ${policy.name}`,
          success: true,
          message: `Política criada com sucesso`
        })
      } catch (error) {
        addResult({
          step: `4. Policy ${policy.name}`,
          success: false,
          message: `Erro ao criar política`,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
  }

  const createAdminUser = async () => {
    try {
      // Tentar criar usuário
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'admin@test.com',
        password: '123456'
      })

      if (signUpError && !signUpError.message.includes('already registered')) {
        throw signUpError
      }

      if (signUpError && signUpError.message.includes('already registered')) {
        // Usuário já existe, tentar fazer login para obter ID
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'admin@test.com',
          password: '123456'
        })

        if (signInError) {
          throw signInError
        }

        // Verificar se já tem perfil
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single()

        if (!existingProfile) {
          // Criar perfil
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: signInData.user.id,
              email: signInData.user.email!,
              display_name: 'Administrador',
              role: 'admin',
              is_active: true
            })

          if (profileError) throw profileError
        }

        addResult({
          step: '5. Usuário Admin',
          success: true,
          message: 'Usuário admin já existia, perfil verificado/criado'
        })
      } else {
        // Usuário criado com sucesso
        if (signUpData.user) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: signUpData.user.id,
              email: signUpData.user.email!,
              display_name: 'Administrador',
              role: 'admin',
              is_active: true
            })

          if (profileError) throw profileError

          addResult({
            step: '5. Usuário Admin',
            success: true,
            message: 'Usuário admin criado com sucesso'
          })
        }
      }
    } catch (error) {
      addResult({
        step: '5. Usuário Admin',
        success: false,
        message: 'Erro ao criar usuário admin',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  const finalTest = async () => {
    try {
      // Testar todas as tabelas
      const tables = ['user_profiles', 'modules', 'clients', 'versions', 'version_clients', 'cards']
      const testResults = []

      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1)

          testResults.push({
            table,
            success: !error,
            count: data?.length || 0,
            error: error?.message
          })
        } catch (e) {
          testResults.push({
            table,
            success: false,
            error: e instanceof Error ? e.message : String(e)
          })
        }
      }

      addResult({
        step: '6. Teste Final',
        success: testResults.every(r => r.success),
        message: 'Teste de todas as tabelas concluído',
        data: testResults
      })

      // Testar login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: '123456'
      })

      if (loginError) throw loginError

      addResult({
        step: '6. Teste Login',
        success: true,
        message: `Login funcionando! Usuário: ${loginData.user.email}`
      })

    } catch (error) {
      addResult({
        step: '6. Teste Final',
        success: false,
        message: 'Erro no teste final',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🏗️ Setup Completo da Base de Dados
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Este processo irá verificar e criar toda a estrutura necessária no Supabase:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Verificar conexão com Supabase</li>
              <li>Criar/verificar tabelas: user_profiles, modules, clients, versions, version_clients, cards</li>
              <li>Criar/verificar funções e triggers automáticos</li>
              <li>Configurar políticas de segurança (RLS)</li>
              <li>Criar usuário administrador inicial</li>
              <li>Executar testes finais</li>
            </ul>
          </div>

          <div className="mb-6">
            <Button
              onClick={runFullSetup}
              disabled={loading}
              className="w-full"
            >
              {loading ? `🔄 ${currentStep}` : '🚀 Executar Setup Completo'}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Resultados:</h2>
              
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">
                      {result.success ? '✅' : '❌'}
                    </span>
                    <strong>{result.step}</strong>
                  </div>
                  
                  <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                    {result.message}
                  </p>
                  
                  {result.error && (
                    <p className="text-red-600 text-sm mt-1 font-mono">
                      Erro: {result.error}
                    </p>
                  )}
                  
                  {result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600">
                        Ver detalhes
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
              
              {!loading && results.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">📋 Próximos Passos:</h3>
                  {results.some(r => !r.success) ? (
                    <div className="text-blue-700">
                      <p>❌ Alguns passos falharam. Verifique os erros acima.</p>
                      <p>🔧 Você pode tentar executar novamente ou corrigir manualmente no painel do Supabase.</p>
                    </div>
                  ) : (
                    <div className="text-blue-700">
                      <p>🎉 <strong>Setup concluído com sucesso!</strong></p>
                      <p>🔑 <strong>Credenciais de login:</strong></p>
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Email: <code className="bg-white px-1 rounded">admin@test.com</code></li>
                        <li>Senha: <code className="bg-white px-1 rounded">123456</code></li>
                      </ul>
                      <p className="mt-2">
                        🚀 <a href="/auth/login" className="text-blue-600 hover:underline">
                          Clique aqui para fazer login →
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}