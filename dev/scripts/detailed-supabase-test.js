const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gikcypxyhghsqduidjtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpa2N5cHh5aGdoc3FkdWlkanRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDc3NTMsImV4cCI6MjA3Mzc4Mzc1M30.KdfHQhOnMQ3IjR1ojlXrW4_7uaP79Jn4uKM31CCzPhk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fullDiagnostic() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO SUPABASE')
  console.log('===================================')
  console.log(`URL: ${supabaseUrl}`)
  console.log(`Key: ${supabaseKey.substring(0, 20)}...`)
  console.log('')

  let step = 1
  
  // Passo 1: Testar conectividade básica
  console.log(`${step++}. TESTANDO CONECTIVIDADE BÁSICA`)
  console.log('─'.repeat(40))
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1)
    
    if (error) {
      console.log('❌ Erro de conectividade:', error.message)
      return false
    }
    console.log('✅ Conectividade OK')
  } catch (e) {
    console.log('❌ Erro de conexão:', e.message)
    return false
  }

  // Passo 2: Verificar tabelas existentes
  console.log(`\n${step++}. VERIFICANDO TABELAS EXISTENTES`)
  console.log('─'.repeat(40))
  try {
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')
    
    if (error) {
      console.log('❌ Erro ao verificar tabelas:', error.message)
    } else {
      console.log('📊 Tabelas encontradas:')
      tables?.forEach(table => {
        console.log(`   - ${table.table_name}`)
      })
      
      const requiredTables = ['user_profiles', 'modules', 'clients', 'versions']
      const existingTables = tables?.map(t => t.table_name) || []
      const missingTables = requiredTables.filter(t => !existingTables.includes(t))
      
      if (missingTables.length > 0) {
        console.log('⚠️ Tabelas faltando:', missingTables.join(', '))
      } else {
        console.log('✅ Todas as tabelas principais existem')
      }
    }
  } catch (e) {
    console.log('❌ Erro:', e.message)
  }

  // Passo 3: Verificar estrutura da user_profiles
  console.log(`\n${step++}. VERIFICANDO ESTRUTURA user_profiles`)
  console.log('─'.repeat(40))
  try {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_profiles')
      .order('ordinal_position')
    
    if (error) {
      console.log('❌ Tabela user_profiles não existe:', error.message)
      console.log('🔧 AÇÃO: Execute COMPLETE_DATABASE_SETUP.sql no painel do Supabase')
    } else {
      console.log('📋 Estrutura da user_profiles:')
      columns?.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`)
      })
    }
  } catch (e) {
    console.log('❌ Erro:', e.message)
  }

  // Passo 4: Verificar dados na user_profiles
  console.log(`\n${step++}. VERIFICANDO DADOS EM user_profiles`)
  console.log('─'.repeat(40))
  try {
    const { data: profiles, error, count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
    
    if (error) {
      console.log('❌ Erro ao acessar user_profiles:', error.message)
    } else {
      console.log(`📊 Total de perfis: ${count || 0}`)
      if (profiles && profiles.length > 0) {
        console.log('👥 Perfis encontrados:')
        profiles.forEach(profile => {
          console.log(`   - ${profile.email} (${profile.role}) - Ativo: ${profile.is_active}`)
        })
      } else {
        console.log('⚠️ Nenhum perfil encontrado')
      }
    }
  } catch (e) {
    console.log('❌ Erro:', e.message)
  }

  // Passo 5: Verificar usuários de auth
  console.log(`\n${step++}. VERIFICANDO SESSÃO ATUAL`)
  console.log('─'.repeat(40))
  try {
    const { data: session, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('❌ Erro ao verificar sessão:', error.message)
    } else if (session.session) {
      console.log('✅ Sessão ativa encontrada:')
      console.log(`   - Email: ${session.session.user.email}`)
      console.log(`   - ID: ${session.session.user.id}`)
    } else {
      console.log('❌ Nenhuma sessão ativa')
    }
  } catch (e) {
    console.log('❌ Erro:', e.message)
  }

  // Passo 6: Tentar criar usuário de teste
  console.log(`\n${step++}. TENTATIVA DE CRIAÇÃO DE USUÁRIO`)
  console.log('─'.repeat(40))
  try {
    console.log('🔄 Tentando criar admin@test.com...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@test.com',
      password: '123456'
    })

    if (signUpError) {
      if (signUpError.message.includes('already') || signUpError.message.includes('registered')) {
        console.log('ℹ️ Usuário já existe, tentando login...')
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'admin@test.com',
          password: '123456'
        })

        if (signInError) {
          console.log('❌ Erro no login:', signInError.message)
          
          // Testar com senha diferente
          console.log('🔄 Tentando senha alternativa...')
          const { data: altLogin, error: altError } = await supabase.auth.signInWithPassword({
            email: 'admin@test.com',
            password: 'admin123'
          })
          
          if (altError) {
            console.log('❌ Senha alternativa também falhou:', altError.message)
          } else {
            console.log('✅ Login com senha alternativa funcionou!')
          }
        } else {
          console.log('✅ Login bem-sucedido!')
          console.log(`   - Email: ${signInData.user.email}`)
          console.log(`   - ID: ${signInData.user.id}`)
          
          // Verificar se tem perfil
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', signInData.user.id)
            .single()
          
          if (profileError) {
            console.log('⚠️ Usuário logado mas sem perfil:', profileError.message)
            console.log('🔧 AÇÃO: Criar perfil manualmente')
          } else {
            console.log('✅ Perfil encontrado:')
            console.log(`   - Nome: ${profile.display_name}`)
            console.log(`   - Role: ${profile.role}`)
            console.log(`   - Ativo: ${profile.is_active}`)
          }
        }
      } else {
        console.log('❌ Erro ao criar usuário:', signUpError.message)
        
        if (signUpError.message.includes('Database error')) {
          console.log('🔧 AÇÃO: Problema na estrutura do banco. Execute COMPLETE_DATABASE_SETUP.sql')
        }
      }
    } else {
      console.log('✅ Usuário criado com sucesso!')
      console.log(`   - Email: ${signUpData.user?.email}`)
      console.log(`   - ID: ${signUpData.user?.id}`)
      console.log(`   - Confirmado: ${signUpData.user?.email_confirmed_at ? 'Sim' : 'Não'}`)
    }
  } catch (e) {
    console.log('❌ Erro geral:', e.message)
  }

  // Passo 7: Testar políticas RLS
  console.log(`\n${step++}. TESTANDO POLÍTICAS RLS`)
  console.log('─'.repeat(40))
  try {
    // Tentar inserir sem autenticação
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .limit(1)
    
    if (error) {
      if (error.message.includes('RLS') || error.message.includes('policy')) {
        console.log('⚠️ RLS está bloqueando acesso. Pode estar muito restritivo.')
        console.log('🔧 AÇÃO: Verificar políticas ou desabilitar RLS temporariamente')
      } else {
        console.log('❌ Erro ao testar modules:', error.message)
      }
    } else {
      console.log('✅ Acesso a modules OK')
      console.log(`   - Registros encontrados: ${data?.length || 0}`)
    }
  } catch (e) {
    console.log('❌ Erro:', e.message)
  }

  // Passo 8: Resumo e recomendações
  console.log(`\n📋 RESUMO E RECOMENDAÇÕES`)
  console.log('═'.repeat(40))
  
  // Verificar novamente perfis para dar recomendação final
  try {
    const { data: finalCheck, error } = await supabase
      .from('user_profiles')
      .select('*')
    
    if (error || !finalCheck || finalCheck.length === 0) {
      console.log('🚨 PROBLEMA PRINCIPAL: Tabela user_profiles vazia ou inacessível')
      console.log('')
      console.log('✅ SOLUÇÃO RECOMENDADA:')
      console.log('1. Vá para: https://console.supabase.co')
      console.log('2. Acesse seu projeto')
      console.log('3. Vá em SQL Editor')
      console.log('4. Execute este SQL:')
      console.log('')
      console.log('-- Criar usuário admin manualmente')
      console.log(`INSERT INTO auth.users (
        id, 
        email, 
        encrypted_password, 
        email_confirmed_at,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        'admin@test.com',
        crypt('123456', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW()
      ) ON CONFLICT (email) DO NOTHING
      RETURNING id;`)
      console.log('')
    } else {
      console.log('✅ Tabela user_profiles acessível')
      console.log('🔧 Tente fazer login via interface web')
    }
  } catch (e) {
    console.log('❌ Erro na verificação final:', e.message)
  }

  console.log('')
  console.log('🌐 Teste via web: http://localhost:3001/auth/login')
  console.log('📧 Credenciais: admin@test.com / 123456')
}

// Executar diagnóstico
fullDiagnostic().catch(console.error)