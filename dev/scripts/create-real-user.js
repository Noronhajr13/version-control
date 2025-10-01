const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gikcypxyhghsqduidjtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpa2N5cHh5aGdoc3FkdWlkanRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDc3NTMsImV4cCI6MjA3Mzc4Mzc1M30.KdfHQhOnMQ3IjR1ojlXrW4_7uaP79Jn4uKM31CCzPhk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createRealUser() {
  console.log('🔧 CRIANDO USUÁRIO COM EMAIL REAL')
  console.log('=================================')
  console.log('')

  // Tentar com emails mais realistas
  const testEmails = [
    'admin@empresa.com.br',
    'administrador@sistema.com.br',
    'usuario@teste.com.br',
    'admin@exemplo.com.br'
  ]

  for (const email of testEmails) {
    console.log(`🧪 Testando com: ${email}`)
    
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: '123456'
      })

      if (signUpError) {
        console.log(`❌ ${email}: ${signUpError.message}`)
        
        if (signUpError.message.includes('already registered')) {
          console.log(`ℹ️ ${email} já existe, tentando login...`)
          
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: email,
            password: '123456'
          })

          if (loginError) {
            console.log(`❌ Login ${email}: ${loginError.message}`)
          } else {
            console.log(`✅ Login ${email}: SUCESSO!`)
            
            // Verificar/criar perfil
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', loginData.user.id)
              .single()

            if (profileError) {
              console.log('🔧 Criando perfil...')
              const { error: createError } = await supabase
                .from('user_profiles')
                .insert({
                  id: loginData.user.id,
                  email: loginData.user.email,
                  display_name: 'Administrador',
                  role: 'admin',
                  is_active: true
                })

              if (createError) {
                console.log('❌ Erro ao criar perfil:', createError.message)
              } else {
                console.log('✅ Perfil criado!')
              }
            } else {
              console.log('✅ Perfil já existe:', profile.role)
            }
            
            console.log('\n🎉 USUÁRIO FUNCIONANDO!')
            console.log(`📧 Email: ${email}`)
            console.log(`🔑 Senha: 123456`)
            console.log('🌐 Teste em: http://localhost:3001/auth/login')
            return
          }
        }
      } else {
        console.log(`✅ ${email}: Usuário criado!`)
        
        if (signUpData.user) {
          // Criar perfil
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: signUpData.user.id,
              email: signUpData.user.email,
              display_name: 'Administrador',
              role: 'admin',
              is_active: true
            })

          if (profileError) {
            console.log('❌ Erro ao criar perfil:', profileError.message)
          } else {
            console.log('✅ Perfil criado!')
          }
          
          console.log('\n🎉 USUÁRIO CRIADO!')
          console.log(`📧 Email: ${email}`)
          console.log(`🔑 Senha: 123456`)
          console.log('📬 Verifique o email para confirmar')
          console.log('🌐 Depois teste em: http://localhost:3001/auth/login')
          return
        }
      }
    } catch (e) {
      console.log(`❌ ${email}: Erro geral: ${e.message}`)
    }
    
    console.log('')
  }

  console.log('🚨 TODOS OS EMAILS FALHARAM!')
  console.log('')
  console.log('🔧 SOLUÇÃO MANUAL:')
  console.log('1. Vá para: https://console.supabase.co')
  console.log('2. Acesse seu projeto')
  console.log('3. Authentication > Users')
  console.log('4. Clique "Add user"')
  console.log('5. Use um email real (ex: seu.email@gmail.com)')
  console.log('6. Senha: 123456')
  console.log('7. Clique "Create user"')
  console.log('')
  console.log('8. Depois execute este SQL no SQL Editor:')
  console.log(`INSERT INTO user_profiles (id, email, display_name, role, is_active)`)
  console.log(`SELECT id, email, 'Administrador', 'admin', true`)
  console.log(`FROM auth.users WHERE email = 'SEU_EMAIL_AQUI'`)
  console.log(`ON CONFLICT (id) DO NOTHING;`)
}

createRealUser().catch(console.error)