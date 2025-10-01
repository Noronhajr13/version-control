const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gikcypxyhghsqduidjtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpa2N5cHh5aGdoc3FkdWlkanRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDc3NTMsImV4cCI6MjA3Mzc4Mzc1M30.KdfHQhOnMQ3IjR1ojlXrW4_7uaP79Jn4uKM31CCzPhk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('=== TESTE DE CONEXÃO SUPABASE ===\n')
  
  try {
    // Teste 1: Verificar conexão básica
    console.log('1. Testando conexão...')
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Erro:', error.message)
      console.log('Detalhes:', error)
    } else {
      console.log('✅ Conexão OK')
    }
    
    // Teste 2: Listar usuários existentes
    console.log('\n2. Verificando usuários...')
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message)
    } else {
      console.log(`✅ Encontrados ${users?.length || 0} usuários`)
      if (users && users.length > 0) {
        users.forEach(user => {
          console.log(`   - ${user.email} (${user.role})`)
        })
      }
    }
    
    // Teste 3: Verificar se a tabela auth.users tem dados
    console.log('\n3. Tentando criar usuário admin...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@test.com',
      password: '123456'
    })
    
    if (authError) {
      console.log('❌ Erro ao criar usuário:', authError.message)
      if (authError.message.includes('already registered')) {
        console.log('ℹ️ Usuário já existe, tentando fazer login...')
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: 'admin@test.com',
          password: '123456'
        })
        
        if (loginError) {
          console.log('❌ Erro no login:', loginError.message)
        } else {
          console.log('✅ Login realizado com sucesso:', loginData.user?.email)
        }
      }
    } else {
      console.log('✅ Usuário criado:', authData.user?.email)
      
      if (authData.user) {
        // Criar perfil
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            display_name: 'Admin Test',
            role: 'admin',
            is_active: true
          })
        
        if (profileError) {
          console.log('❌ Erro ao criar perfil:', profileError.message)
        } else {
          console.log('✅ Perfil criado com sucesso')
        }
      }
    }
    
  } catch (error) {
    console.log('❌ ERRO GERAL:', error.message)
  }
}

testConnection()
