const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gikcypxyhghsqduidjtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpa2N5cHh5aGdoc3FkdWlkanRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDc3NTMsImV4cCI6MjA3Mzc4Mzc1M30.KdfHQhOnMQ3IjR1ojlXrW4_7uaP79Jn4uKM31CCzPhk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixLoginProblem() {
  console.log('🔧 CORREÇÃO COMPLETA DO PROBLEMA DE LOGIN')
  console.log('==========================================')
  console.log('')

  try {
    // Primeiro, limpar qualquer sessão existente
    console.log('1. Limpando sessões existentes...')
    await supabase.auth.signOut()
    console.log('✅ Sessões limpas')

    // Fazer login com as credenciais admin
    console.log('\n2. Fazendo login com credenciais administrativas...')
    const adminEmail = 'administrador@sistema.com.br'
    const adminPassword = '123456'

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    })

    if (loginError) {
      console.log('❌ Erro no login admin:', loginError.message)
      return
    }

    console.log('✅ Login admin bem-sucedido!')
    console.log(`   Email: ${loginData.user.email}`)
    console.log(`   ID: ${loginData.user.id}`)

    // Verificar se perfil existe
    console.log('\n3. Verificando perfil administrativo...')
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', loginData.user.id)
      .single()

    if (profileError || !profile) {
      console.log('⚠️ Perfil admin não encontrado, criando...')
      
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .upsert({
          id: loginData.user.id,
          email: loginData.user.email,
          display_name: 'Administrador do Sistema',
          role: 'admin',
          is_active: true
        })
        .select()
        .single()

      if (createError) {
        console.log('❌ Erro ao criar perfil admin:', createError.message)
        return
      }

      console.log('✅ Perfil admin criado!')
      console.log(`   Nome: ${newProfile?.display_name || 'Administrador do Sistema'}`)
      console.log(`   Role: admin`)
    } else {
      console.log('✅ Perfil admin encontrado!')
      console.log(`   Nome: ${profile.display_name}`)
      console.log(`   Role: ${profile.role}`)
      console.log(`   Ativo: ${profile.is_active}`)
    }

    // Verificar sessão final
    console.log('\n4. Verificação final da sessão...')
    const { data: finalSession, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.log('❌ Erro na verificação final:', sessionError.message)
    } else if (finalSession.session) {
      console.log('✅ Sessão administrativa válida!')
      console.log(`   Usuário: ${finalSession.session.user.email}`)
      console.log(`   Expira em: ${new Date(finalSession.session.expires_at * 1000).toLocaleString()}`)
    }

    console.log('\n🎯 CORREÇÃO APLICADA COM SUCESSO!')
    console.log('==================================')
    console.log('📋 INSTRUÇÕES PARA TESTE:')
    console.log('1. Abra uma nova aba no navegador')
    console.log('2. Vá para: http://localhost:3001/auth/login')
    console.log('3. Use as credenciais:')
    console.log('   Email: administrador@sistema.com.br')
    console.log('   Senha: 123456')
    console.log('4. O login deve funcionar normalmente agora')
    console.log('')
    console.log('💡 Se ainda houver problema, clique no botão "CORRIGIR LOGIN" no painel de debug')

  } catch (e) {
    console.log('❌ Erro geral:', e.message)
  }
}

fixLoginProblem().catch(console.error)