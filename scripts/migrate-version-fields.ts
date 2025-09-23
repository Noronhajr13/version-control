import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Executando migração: adicionar campos powerbuilder_version e exe_path...')
  
  try {
    // 1. Adicionar novos campos
    console.log('📝 Adicionando campos powerbuilder_version e exe_path...')
    const { error: addColumnsError } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE versions 
        ADD COLUMN IF NOT EXISTS powerbuilder_version TEXT,
        ADD COLUMN IF NOT EXISTS exe_path TEXT;
      `
    })

    if (addColumnsError) {
      console.error('❌ Erro ao adicionar colunas:', addColumnsError)
      throw addColumnsError
    }

    // 2. Renomear coluna script_executed para scripts
    console.log('📝 Renomeando campo script_executed para scripts...')
    const { error: renameError } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE versions 
        RENAME COLUMN script_executed TO scripts;
      `
    })

    if (renameError && !renameError.message.includes('does not exist')) {
      console.error('❌ Erro ao renomear coluna:', renameError)
      throw renameError
    }

    // 3. Verificar estrutura
    console.log('🔍 Verificando estrutura da tabela...')
    const { data: columns, error: structureError } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'versions' 
        ORDER BY ordinal_position;
      `
    })

    if (structureError) {
      console.error('❌ Erro ao verificar estrutura:', structureError)
    } else {
      console.log('✅ Estrutura da tabela versions:')
      console.table(columns)
    }

    console.log('✅ Migração concluída com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro na migração:', error)
    throw error
  }
}

// Executar migração
runMigration()
  .then(() => {
    console.log('🎉 Migração finalizada!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Falha na migração:', error)
    process.exit(1)
  })