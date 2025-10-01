const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gikcypxyhghsqduidjtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpa2N5cHh5aGdoc3FkdWlkanRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDc3NTMsImV4cCI6MjA3Mzc4Mzc1M30.KdfHQhOnMQ3IjR1ojlXrW4_7uaP79Jn4uKM31CCzPhk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function simpleTest() {
  console.log('🧪 TESTE BÁSICO DO SUPABASE')
  console.log('==========================')
  console.log('')

  // Teste 1: Tentar acessar uma tabela diretamente
  console.log('1. Testando acesso direto a user_profiles...')
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Erro:', error.message)
      console.log('Código:', error.code)
      console.log('Detalhes:', error.details)
      console.log('Hint:', error.hint)
    } else {
      console.log('✅ user_profiles acessível!')
      console.log('Dados:', data)
    }
  } catch (e) {
    console.log('❌ Erro de conexão:', e.message)
  }

  // Teste 2: Tentar auth
  console.log('\n2. Testando sistema de auth...')
  try {
    const { data: session, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('❌ Erro no auth:', error.message)
    } else {
      console.log('✅ Auth funcionando!')
      if (session.session) {
        console.log('Usuário logado:', session.session.user.email)
      } else {
        console.log('Nenhum usuário logado')
      }
    }
  } catch (e) {
    console.log('❌ Erro:', e.message)
  }

  // Teste 3: Tentar signup
  console.log('\n3. Testando criação de usuário...')
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: '123456'
    })

    if (signUpError) {
      console.log('❌ Erro no signup:', signUpError.message)
      if (signUpError.message.includes('already')) {
        console.log('ℹ️ Usuário já existe, isso é normal')
      }
    } else {
      console.log('✅ Signup funcionou!')
      console.log('Usuário criado:', signUpData.user?.email)
    }
  } catch (e) {
    console.log('❌ Erro:', e.message)
  }

  // Teste 4: Tentar signin
  console.log('\n4. Testando login...')
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: '123456'
    })

    if (signInError) {
      console.log('❌ Erro no login:', signInError.message)
    } else {
      console.log('✅ Login funcionou!')
      console.log('Usuário:', signInData.user.email)
      
      // Agora tentar acessar user_profiles logado
      console.log('\n5. Testando acesso a user_profiles logado...')
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .single()
      
      if (profileError) {
        console.log('❌ Erro ao buscar perfil:', profileError.message)
      } else {
        console.log('✅ Perfil encontrado:', profile)
      }
    }
  } catch (e) {
    console.log('❌ Erro:', e.message)
  }

  // Teste 5: Tentar outras tabelas
  console.log('\n6. Testando outras tabelas...')
  const tables = ['modules', 'clients', 'versions']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: OK (${data?.length || 0} registros)`)
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`)
    }
  }

  console.log('\n📋 DIAGNÓSTICO FINAL:')
  console.log('=====================')
  console.log('Se todos os testes falharam, o problema pode ser:')
  console.log('1. 🔑 Chaves do Supabase incorretas')
  console.log('2. 🗄️ Banco de dados não inicializado')
  console.log('3. 🚫 RLS muito restritivo')
  console.log('4. 🌐 Problema de rede/conectividade')
  console.log('')
  console.log('PRÓXIMO PASSO: Verificar no painel do Supabase se:')
  console.log('- Projeto está ativo')
  console.log('- Tabelas existem')
  console.log('- RLS está configurado corretamente')
}

simpleTest().catch(console.error)