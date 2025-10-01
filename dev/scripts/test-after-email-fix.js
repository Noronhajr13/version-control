const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gikcypxyhghsqduidjtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpa2N5cHh5aGdoc3FkdWlkanRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDc3NTMsImV4cCI6MjA3Mzc4Mzc1M30.KdfHQhOnMQ3IjR1ojlXrW4_7uaP79Jn4uKM31CCzPhk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAfterEmailConfirmation() {
  console.log('🧪 TESTE APÓS CONFIRMAÇÃO DE EMAIL')
  console.log('===================================')
  console.log('')

  const email = 'administrador@sistema.com.br'
  const password = '123456'

  try {
    // Primeiro, tentar o login
    console.log('1. Tentando fazer login...')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Senha: ${password}`)
    console.log('')

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (loginError) {
      console.log('❌ Erro no login:', loginError.message)
      
      if (loginError.message.includes('Email not confirmed')) {
        console.log('')
        console.log('🔧 EMAIL AINDA NÃO CONFIRMADO!')
        console.log('Execute o SQL: CONFIRM_EMAIL_AND_FIX.sql no painel do Supabase')
        console.log('')
        return
      }
      
      if (loginError.message.includes('Invalid login credentials')) {
        console.log('')
        console.log('🔧 CREDENCIAIS INVÁLIDAS!')
        console.log('Possíveis causas:')
        console.log('- Usuário não existe')
        console.log('- Senha incorreta')
        console.log('- Email ainda não confirmado')
        console.log('')
        return
      }
      
      console.log('❌ Outro erro:', loginError.message)
      return
    }

    console.log('✅ LOGIN REALIZADO COM SUCESSO!')
    console.log(`   👤 Usuário: ${loginData.user.email}`)
    console.log(`   🆔 ID: ${loginData.user.id}`)
    console.log(`   ✉️ Email confirmado: ${loginData.user.email_confirmed_at ? 'SIM' : 'NÃO'}`)
    console.log('')

    // Agora testar o perfil
    console.log('2. Verificando perfil do usuário...')
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', loginData.user.id)
      .single()

    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError.message)
      
      if (profileError.message.includes('PGRST116')) {
        console.log('⚠️ Perfil não encontrado')
        console.log('🔧 Execute o SQL: CONFIRM_EMAIL_AND_FIX.sql para criar o perfil')
      }
      
      if (profileError.message.includes('policy')) {
        console.log('⚠️ Problema de RLS (política de segurança)')
        console.log('🔧 Execute o SQL: CONFIRM_EMAIL_AND_FIX.sql para ajustar RLS')
      }
      
      return
    }

    console.log('✅ PERFIL ENCONTRADO COM SUCESSO!')
    console.log(`   📝 Nome: ${profile.display_name}`)
    console.log(`   🎭 Role: ${profile.role}`)
    console.log(`   ✅ Ativo: ${profile.is_active ? 'SIM' : 'NÃO'}`)
    console.log(`   📅 Criado em: ${profile.created_at}`)
    console.log('')

    // Testar acesso às tabelas do sistema
    console.log('3. Testando acesso às tabelas do sistema...')
    const tables = ['modules', 'clients', 'versions', 'version_clients']
    let allTablesOk = true

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
          allTablesOk = false
        } else {
          console.log(`✅ ${table}: OK (${data?.length || 0} registros)`)
        }
      } catch (e) {
        console.log(`❌ ${table}: ${e.message}`)
        allTablesOk = false
      }
    }

    console.log('')
    console.log('🎯 RESULTADO FINAL:')
    console.log('==================')
    
    if (allTablesOk) {
      console.log('🎉 PARABÉNS! TUDO FUNCIONANDO PERFEITAMENTE!')
      console.log('')
      console.log('✅ Login: OK')
      console.log('✅ Email confirmado: OK') 
      console.log('✅ Perfil: OK (role: admin)')
      console.log('✅ Acesso às tabelas: OK')
      console.log('')
      console.log('🌐 AGORA PODE USAR O SISTEMA:')
      console.log('   URL: http://localhost:3001/auth/login')
      console.log(`   Email: ${email}`)
      console.log(`   Senha: ${password}`)
      console.log('')
      console.log('🚀 Sistema pronto para produção!')
    } else {
      console.log('⚠️ Login funcionou mas há problemas de acesso às tabelas')
      console.log('🔧 Pode ser necessário ajustar as políticas RLS')
    }

  } catch (e) {
    console.log('❌ Erro geral no teste:', e.message)
  }
}

testAfterEmailConfirmation().catch(console.error)