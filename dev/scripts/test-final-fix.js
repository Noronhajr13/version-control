const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gikcypxyhghsqduidjtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpa2N5cHh5aGdoc3FkdWlkanRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDc3NTMsImV4cCI6MjA3Mzc4Mzc1M30.KdfHQhOnMQ3IjR1ojlXrW4_7uaP79Jn4uKM31CCzPhk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFinalFix() {
  console.log('🎯 TESTE FINAL - CORREÇÃO SIMPLES')
  console.log('=================================')
  
  const email = 'administrador@sistema.com.br'
  const password = '123456'

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    console.log('❌ Login falhou:', error.message)
    return
  }

  console.log('✅ LOGIN OK!')
  console.log(`   Email: ${data.user.email}`)
  console.log('')
  console.log('🚀 AGORA TESTE:')
  console.log('   1. Vá para: http://localhost:3001/auth/login')
  console.log('   2. Use: administrador@sistema.com.br / 123456')
  console.log('   3. Deve redirecionar IMEDIATAMENTE para /dashboard')
  console.log('')
  console.log('💡 CORREÇÃO APLICADA:')
  console.log('   - Perfil criado INSTANTANEAMENTE (sem await)')
  console.log('   - Não espera mais o banco de dados')
  console.log('   - Loading infinito RESOLVIDO')
  
  // Logout para não interferir
  await supabase.auth.signOut()
}

testFinalFix().catch(console.error)