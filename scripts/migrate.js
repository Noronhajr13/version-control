const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gikcypxyhghsqduidjtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpa2N5cHh5aGdoc3FkdWlkanRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDc3NTMsImV4cCI6MjA3Mzc4Mzc1M30.KdfHQhOnMQ3IjR1ojlXrW4_7uaP79Jn4uKM31CCzPhk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🚀 Executando migração para adicionar novos campos...')
  
  try {
    // Verificar estrutura atual
    console.log('🔍 Verificando estrutura atual da tabela versions...')
    const { data: currentStructure, error: structureError } = await supabase
      .from('versions')
      .select()
      .limit(1)

    if (structureError) {
      console.log('Erro ao verificar estrutura:', structureError)
    } else {
      console.log('✅ Tabela versions acessível')
      if (currentStructure && currentStructure[0]) {
        console.log('Campos atuais:', Object.keys(currentStructure[0]))
      }
    }

    console.log('✅ Migração simulada concluída!')
    console.log('📝 Execute os seguintes comandos no Supabase SQL Editor:')
    console.log(`
-- 1. Adicionar novos campos
ALTER TABLE versions 
ADD COLUMN IF NOT EXISTS powerbuilder_version TEXT,
ADD COLUMN IF NOT EXISTS exe_path TEXT;

-- 2. Renomear campo script_executed para scripts  
ALTER TABLE versions 
RENAME COLUMN script_executed TO scripts;

-- 3. Verificar estrutura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'versions' 
ORDER BY ordinal_position;
    `)
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

runMigration()