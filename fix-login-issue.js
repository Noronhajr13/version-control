const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gikcypxyhghsqduidjtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpa2N5cHh5aGdoc3FkdWlkanRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDc3NTMsImV4cCI6MjA3Mzc4Mzc1M30.KdfHQhOnMQ3IjR1ojlXrW4_7uaP79Jn4uKM31CCzPhk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixLoginIssue() {
  console.log('🔧 CORRIGINDO PROBLEMA DE LOGIN')
  console.log('===============================')
  console.log('')

  // Passo 1: Verificar se existe usuário admin@test.com
  console.log('1. Verificando se admin@test.com existe...')
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: '123456'
    })

    if (signInError) {
      console.log('❌ Login falhou:', signInError.message)
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('🔧 Usuário não existe ou senha errada')
        
        // Tentar criar o usuário
        console.log('\n2. Tentando criar admin@test.com...')
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: 'admin@test.com',
          password: '123456'
        })

        if (signUpError) {
          console.log('❌ Erro ao criar:', signUpError.message)
          
          if (signUpError.message.includes('already registered')) {
            console.log('ℹ️ Usuário já existe mas senha está errada')
            console.log('🔧 Tente fazer reset da senha ou usar senha diferente')
          }
        } else {
          console.log('✅ Usuário criado com sucesso!')
          console.log('📧 Verifique o email para confirmar a conta')
          
          if (signUpData.user) {
            // Criar perfil automaticamente
            console.log('\n3. Criando perfil do usuário...')
            const { data: profileData, error: profileError } = await supabase
              .from('user_profiles')
              .insert({
                id: signUpData.user.id,
                email: signUpData.user.email,
                display_name: 'Administrador',
                role: 'admin',
                is_active: true
              })
              .select()
              .single()

            if (profileError) {
              console.log('❌ Erro ao criar perfil:', profileError.message)
              console.log('🔧 Mas o usuário foi criado. Tente fazer login.')
            } else {
              console.log('✅ Perfil criado com sucesso!')
              console.log('Dados do perfil:', profileData)
            }
          }
        }
      }
    } else {
      console.log('✅ Login funcionou!')
      console.log('Usuário logado:', signInData.user.email)
      
      // Verificar se tem perfil
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .single()

      if (profileError) {
        console.log('⚠️ Usuário logado mas sem perfil')
        
        // Criar perfil
        console.log('🔧 Criando perfil...')
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: signInData.user.id,
            email: signInData.user.email,
            display_name: 'Administrador',
            role: 'admin',
            is_active: true
          })
          .select()
          .single()

        if (createError) {
          console.log('❌ Erro ao criar perfil:', createError.message)
        } else {
          console.log('✅ Perfil criado:', newProfile)
        }
      } else {
        console.log('✅ Perfil encontrado:', profile)
      }
    }
  } catch (e) {
    console.log('❌ Erro geral:', e.message)
  }

  // Passo 2: Verificar política RLS
  console.log('\n4. Verificando se RLS está bloqueando...')
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5)

    if (error) {
      console.log('❌ RLS pode estar bloqueando:', error.message)
      console.log('🔧 SOLUÇÃO: Execute este SQL no painel do Supabase:')
      console.log('')
      console.log('-- Temporariamente desabilitar RLS para debug')
      console.log('ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;')
      console.log('')
      console.log('-- Ou criar política mais permissiva')
      console.log(`DROP POLICY IF EXISTS "Temp allow all" ON user_profiles;`)
      console.log(`CREATE POLICY "Temp allow all" ON user_profiles FOR ALL USING (true);`)
      console.log('')
    } else {
      console.log('✅ Perfis acessíveis:')
      profiles?.forEach(p => {
        console.log(`   - ${p.email} (${p.role})`)
      })
    }
  } catch (e) {
    console.log('❌ Erro:', e.message)
  }

  console.log('\n🎯 TESTE FINAL - FAZER LOGIN AGORA')
  console.log('==================================')
  try {
    const { data: finalLogin, error: finalError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: '123456'
    })

    if (finalError) {
      console.log('❌ Login ainda não funciona:', finalError.message)
      console.log('')
      console.log('🔧 PRÓXIMOS PASSOS:')
      console.log('1. Vá para: https://console.supabase.co')
      console.log('2. Acesse Authentication > Users')
      console.log('3. Verifique se admin@test.com está lá')
      console.log('4. Se não estiver, crie manualmente')
      console.log('5. Se estiver, faça reset da senha')
    } else {
      console.log('🎉 SUCESSO! Login funcionando!')
      console.log(`✅ Usuário: ${finalLogin.user.email}`)
      console.log('')
      console.log('🌐 Agora teste no navegador:')
      console.log('   http://localhost:3001/auth/login')
      console.log('   Email: admin@test.com')
      console.log('   Senha: 123456')
    }
  } catch (e) {
    console.log('❌ Erro no teste final:', e.message)
  }
}

fixLoginIssue().catch(console.error)