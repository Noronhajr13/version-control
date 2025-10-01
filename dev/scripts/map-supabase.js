const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Mapeando estrutura atual do Supabase...')

const supabase = createClient(supabaseUrl, supabaseKey)

async function mapSupabaseStructure() {
  try {
    console.log('\n📊 VERIFICANDO TABELAS...')
    
    // Verificar tabelas existentes
    const { data: tables, error: tablesError } = await supabase
      .rpc('sql', { 
        query: `
        SELECT table_name, column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name IN ('user_profiles', 'versions', 'clients', 'modules')
        ORDER BY table_name, ordinal_position;
        `
      })
    
    if (!tablesError && tables) {
      console.log('✅ Estrutura das tabelas:')
      console.table(tables)
    } else {
      console.log('⚠️ Erro ao verificar tabelas:', tablesError?.message)
    }

    console.log('\n🔧 VERIFICANDO FUNÇÕES...')
    
    // Verificar funções existentes
    const { data: functions, error: funcError } = await supabase
      .rpc('sql', {
        query: `
        SELECT 
          proname as function_name,
          pg_get_function_result(oid) as return_type,
          pronargs as num_args
        FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ORDER BY proname;
        `
      })
    
    if (!funcError && functions) {
      console.log('✅ Funções existentes:')
      console.table(functions)
    } else {
      console.log('⚠️ Erro ao verificar funções:', funcError?.message)
    }

    console.log('\n🎯 VERIFICANDO TRIGGERS...')
    
    // Verificar triggers existentes
    const { data: triggers, error: triggerError } = await supabase
      .rpc('sql', {
        query: `
        SELECT 
          trigger_name,
          event_object_table,
          action_timing,
          event_manipulation
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        ORDER BY event_object_table, trigger_name;
        `
      })
    
    if (!triggerError && triggers) {
      console.log('✅ Triggers existentes:')
      console.table(triggers)
    } else {
      console.log('⚠️ Erro ao verificar triggers:', triggerError?.message)
    }

    console.log('\n📝 VERIFICANDO ENUMS...')
    
    // Verificar enums existentes
    const { data: enums, error: enumError } = await supabase
      .rpc('sql', {
        query: `
        SELECT 
          t.typname as enum_name,
          array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typtype = 'e'
        GROUP BY t.typname
        ORDER BY t.typname;
        `
      })
    
    if (!enumError && enums) {
      console.log('✅ Enums existentes:')
      console.table(enums)
    } else {
      console.log('⚠️ Erro ao verificar enums:', enumError?.message)
    }

    console.log('\n📋 VERIFICANDO DADOS ATUAIS...')
    
    // Verificar dados das tabelas
    const tables_to_check = ['user_profiles', 'versions', 'clients', 'modules']
    
    for (const table of tables_to_check) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(3)
        
        if (!error) {
          console.log(`\n📊 Tabela ${table}: ${count} registros`)
          if (data && data.length > 0) {
            console.log('Amostra dos dados:')
            console.table(data)
          }
        } else {
          console.log(`⚠️ Erro ao acessar ${table}:`, error.message)
        }
      } catch (err) {
        console.log(`❌ Erro na tabela ${table}:`, err.message)
      }
    }

    console.log('\n🎉 MAPEAMENTO CONCLUÍDO!')
    
  } catch (error) {
    console.error('❌ Erro geral no mapeamento:', error)
  }
}

mapSupabaseStructure()