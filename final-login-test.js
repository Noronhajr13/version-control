const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gikcypxyhghsqduidjtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpa2N5cHh5aGdoc3FkdWlkanRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDc3NTMsImV4cCI6MjA3Mzc4Mzc1M30.KdfHQhOnMQ3IjR1ojlXrW4_7uaP79Jn4uKM31CCzPhk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function finalTest() {
  console.log('🎯 TESTE FINAL DO LOGIN')
  console.log('=======================')
  console.log('')

  const email = 'administrador@sistema.com.br'
  const password = '123456'

  console.log(`📧 Email: ${email}`)
  console.log(`🔑 Senha: ${password}`)
  console.log('')

  try {
    // Tentar fazer login
    console.log('1. Tentando fazer login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (loginError) {
      console.log('❌ Erro no login:', loginError.message)
      
      if (loginError.message.includes('Invalid login credentials')) {
        console.log('🔧 POSSÍVEIS CAUSAS:')
        console.log('   - Email não confirmado')
        console.log('   - Senha incorreta')
        console.log('   - Usuário não existe')
        console.log('')
        console.log('💡 SOLUÇÃO:')
        console.log('1. Vá para: https://console.supabase.co')
        console.log('2. Authentication > Users')
        console.log('3. Procure por: administrador@sistema.com.br')
        console.log('4. Se existir, clique nos 3 pontos > "Send magic link"')
        console.log('5. Ou clique nos 3 pontos > "Reset password"')
      }
      return
    }

    console.log('✅ Login realizado com sucesso!')
    console.log(`   ID: ${loginData.user.id}`)
    console.log(`   Email: ${loginData.user.email}`)
    console.log(`   Confirmado: ${loginData.user.email_confirmed_at ? 'Sim' : 'Não'}`)

    // Verificar perfil
    console.log('\n2. Verificando perfil...')
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', loginData.user.id)
      .single()

    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError.message)
      console.log('🔧 Execute o SQL FIX_RLS_PROBLEM.sql no painel do Supabase')
    } else {
      console.log('✅ Perfil encontrado!')
      console.log(`   Nome: ${profile.display_name}`)
      console.log(`   Role: ${profile.role}`)
      console.log(`   Ativo: ${profile.is_active}`)
    }

    // Testar acesso às outras tabelas
    console.log('\n3. Testando acesso às tabelas...')
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
          console.log(`✅ ${table}: Acesso OK (${data?.length || 0} registros)`)
        }
      } catch (e) {
        console.log(`❌ ${table}: ${e.message}`)
      }
    }

    console.log('\n🎉 RESULTADO FINAL:')
    console.log('==================')
    if (profile) {
      console.log('✅ Login funcionando completamente!')
      console.log('🌐 Teste agora no navegador:')
      console.log('   http://localhost:3001/auth/login')
      console.log(`   Email: ${email}`)
      console.log(`   Senha: ${password}`)
    } else {
      console.log('⚠️ Login funciona mas perfil precisa ser criado')
      console.log('🔧 Execute FIX_RLS_PROBLEM.sql no painel do Supabase')
    }

  } catch (e) {
    console.log('❌ Erro geral:', e.message)
  }
}

finalTest().catch(console.error)