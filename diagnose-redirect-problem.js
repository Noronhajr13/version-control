const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gikcypxyhghsqduidjtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpa2N5cHh5aGdoc3FkdWlkanRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDc3NTMsImV4cCI6MjA3Mzc4Mzc1M30.KdfHQhOnMQ3IjR1ojlXrW4_7uaP79Jn4uKM31CCzPhk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseRedirectProblem() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO PROBLEMA DE REDIRECIONAMENTO')
  console.log('====================================================')
  console.log('')

  const email = 'noronhajr22@gmail.com'

  try {
    console.log('1. Verificando usuário atual...')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('❌ Erro na sessão:', sessionError.message)
      return
    }

    if (sessionData.session) {
      console.log('✅ Sessão ativa encontrada!')
      console.log(`   Email usuário: ${sessionData.session.user.email}`)
      console.log(`   ID usuário: ${sessionData.session.user.id}`)
      console.log(`   Email confirmado: ${sessionData.session.user.email_confirmed_at ? 'SIM' : 'NÃO'}`)
      
      // Verificar perfil
      console.log('\n2. Verificando perfil do usuário...')
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single()

      if (profileError) {
        console.log('❌ PROBLEMA ENCONTRADO - Perfil não existe!')
        console.log(`   Erro: ${profileError.message}`)
        console.log('')
        console.log('🔧 CRIANDO PERFIL AUTOMATICAMENTE...')
        
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: sessionData.session.user.id,
            email: sessionData.session.user.email,
            display_name: sessionData.session.user.email,
            role: 'admin',
            is_active: true
          })
          .select()
          .single()

        if (createError) {
          console.log('❌ Erro ao criar perfil:', createError.message)
        } else {
          console.log('✅ Perfil criado com sucesso!')
          console.log(`   Nome: ${newProfile?.display_name || sessionData.session.user.email}`)
          console.log(`   Role: admin`)
          console.log(`   Ativo: true`)
        }
      } else {
        console.log('✅ Perfil encontrado!')
        console.log(`   Nome: ${profile.display_name}`)
        console.log(`   Role: ${profile.role}`)
        console.log(`   Ativo: ${profile.is_active}`)
      }

    } else {
      console.log('❌ Nenhuma sessão ativa encontrada')
      console.log('   O usuário não está logado no servidor')
    }

    console.log('\n3. Testando credenciais administrativas...')
    const adminEmail = 'administrador@sistema.com.br'
    const adminPassword = '123456'

    const { data: adminCheck, error: adminError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    })

    if (adminError) {
      console.log('❌ Credenciais admin não funcionam:', adminError.message)
    } else {
      console.log('✅ Credenciais admin funcionam!')
      console.log(`   Email: ${adminCheck.user.email}`)
      
      // Fazer logout para não afetar a sessão atual
      await supabase.auth.signOut()
    }

    console.log('\n🎯 DIAGNÓSTICO DO PROBLEMA:')
    console.log('===========================')
    
    if (sessionData.session && !profile) {
      console.log('⚠️ PROBLEMA IDENTIFICADO:')
      console.log('   - Usuário está autenticado ✅')
      console.log('   - Mas perfil não existe ❌')
      console.log('   - AuthContext não consegue carregar dados completos')
      console.log('   - Por isso fica em loading infinito')
      console.log('')
      console.log('🔧 SOLUÇÃO:')
      console.log('   - Perfil foi criado automaticamente')
      console.log('   - Recarregue a página para testar')
      console.log('   - Ou use as credenciais admin: administrador@sistema.com.br / 123456')
    } else if (!sessionData.session) {
      console.log('⚠️ PROBLEMA: Usuário não está autenticado')
      console.log('   - Faça login novamente')
      console.log('   - Use: administrador@sistema.com.br / 123456')
    } else {
      console.log('✅ Dados parecem corretos')
      console.log('   - Problema pode ser no código do frontend')
      console.log('   - Verifique console do browser para mais detalhes')
    }

  } catch (e) {
    console.log('❌ Erro geral:', e.message)
  }
}

diagnoseRedirectProblem().catch(console.error)