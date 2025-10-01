const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gikcypxyhghsqduidjtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpa2N5cHh5aGdoc3FkdWlkanRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDc3NTMsImV4cCI6MjA3Mzc4Mzc1M30.KdfHQhOnMQ3IjR1ojlXrW4_7uaP79Jn4uKM31CCzPhk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRedirectFix() {
  console.log('🔧 TESTE DO REDIRECIONAMENTO APÓS CORREÇÃO')
  console.log('==========================================')
  console.log('')

  const email = 'administrador@sistema.com.br'
  const password = '123456'

  try {
    console.log('1. Tentando fazer login...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.log('❌ Erro no login:', error.message)
      return
    }

    console.log('✅ Login bem-sucedido!')
    console.log(`   Email: ${data.user.email}`)
    console.log(`   ID: ${data.user.id}`)
    console.log(`   Confirmado: ${data.user.email_confirmed_at ? 'SIM' : 'NÃO'}`)

    // Verificar sessão
    console.log('\n2. Verificando sessão ativa...')
    const { data: session, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.log('❌ Erro ao verificar sessão:', sessionError.message)
    } else if (session.session) {
      console.log('✅ Sessão ativa encontrada!')
      console.log(`   Usuário: ${session.session.user.email}`)
      console.log(`   Expira em: ${new Date(session.session.expires_at * 1000).toLocaleString()}`)
    } else {
      console.log('❌ Nenhuma sessão ativa')
    }

    // Verificar perfil
    console.log('\n3. Verificando perfil...')
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError.message)
    } else {
      console.log('✅ Perfil encontrado!')
      console.log(`   Nome: ${profile.display_name}`)
      console.log(`   Role: ${profile.role}`)
      console.log(`   Ativo: ${profile.is_active}`)
    }

    console.log('\n🎯 ANÁLISE DO PROBLEMA DE REDIRECIONAMENTO:')
    console.log('============================================')
    
    if (data.user && session.session && profile) {
      console.log('✅ Todos os dados necessários estão disponíveis:')
      console.log('   - Usuário autenticado: SIM')
      console.log('   - Sessão válida: SIM')
      console.log('   - Perfil completo: SIM')
      console.log('')
      console.log('🔧 CORREÇÕES APLICADAS:')
      console.log('   - Login usa window.location.href em vez de router.push')
      console.log('   - Dashboard layout melhorado com logs detalhados')
      console.log('   - Timeout adicionado para aguardar contexto atualizar')
      console.log('')
      console.log('🧪 TESTE AGORA:')
      console.log('   1. Abra: http://localhost:3001/auth/login')
      console.log('   2. Use: administrador@sistema.com.br / 123456')
      console.log('   3. Aguarde redirecionamento automático')
      console.log('   4. Verifique console do browser para logs detalhados')
    } else {
      console.log('⚠️ Dados incompletos podem causar problemas de redirecionamento')
      if (!data.user) console.log('   - Usuário: FALTANDO')
      if (!session.session) console.log('   - Sessão: FALTANDO')
      if (!profile) console.log('   - Perfil: FALTANDO')
    }

  } catch (e) {
    console.log('❌ Erro geral:', e.message)
  }
}

testRedirectFix().catch(console.error)