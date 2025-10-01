const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gikcypxyhghsqduidjtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpa2N5cHh5aGdoc3FkdWlkanRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDc3NTMsImV4cCI6MjA3Mzc4Mzc1M30.KdfHQhOnMQ3IjR1ojlXrW4_7uaP79Jn4uKM31CCzPhk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRPC() {
  console.log('🧪 TESTANDO RPC SQL...\n')
  
  try {
    // Teste simples - verificar se RPC funciona
    console.log('1. Testando chamada RPC básica...')
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT 
          'RPC funcionando!' as status,
          NOW() as timestamp,
          version() as postgres_version;
      `
    })
    
    if (error) {
      console.log('❌ RPC não funciona:', error.message)
      console.log('\n📋 SOLUÇÃO:')
      console.log('1. Vá para o painel do Supabase')
      console.log('2. SQL Editor')
      console.log('3. Execute os scripts SQL manualmente')
      console.log('4. Depois use /database-setup no navegador')
      return false
    }
    
    console.log('✅ RPC funcionando!')
    console.log('Dados:', data)
    
    // Teste 2 - verificar tabelas existentes
    console.log('\n2. Verificando tabelas existentes...')
    const { data: tables, error: tablesError } = await supabase.rpc('sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('user_profiles', 'modules', 'clients', 'versions')
        ORDER BY table_name;
      `
    })
    
    if (tablesError) {
      console.log('❌ Erro ao verificar tabelas:', tablesError.message)
    } else {
      console.log('✅ Tabelas encontradas:', tables?.map(t => t.table_name) || [])
    }
    
    return true
    
  } catch (error) {
    console.log('❌ ERRO GERAL:', error.message)
    return false
  }
}

async function runDiagnostic() {
  const rpcWorks = await testRPC()
  
  console.log('\n📋 RECOMENDAÇÃO:')
  if (rpcWorks) {
    console.log('✅ Use /database-setup no navegador para setup automático')
    console.log('🌐 Ou execute COMPLETE_DATABASE_SETUP.sql no painel do Supabase')
  } else {
    console.log('⚠️ RPC não funciona - use apenas método manual:')
    console.log('1. Vá para console.supabase.co')
    console.log('2. Seu projeto > SQL Editor')
    console.log('3. Execute DIAGNOSTIC_AND_CLEANUP.sql primeiro')
    console.log('4. Depois execute COMPLETE_DATABASE_SETUP.sql')
  }
  
  console.log('\n🎯 OBJETIVO: Criar estrutura completa + usuário admin')
  console.log('📧 Credenciais que serão criadas: admin@test.com / 123456')
}

runDiagnostic()