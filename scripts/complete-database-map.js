// Script para mapear toda a estrutura do Supabase
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function mapDatabaseStructure() {
  const structure = {
    tables: [],
    views: [],
    functions: [],
    triggers: [],
    enums: [],
    policies: []
  };

  try {
    // Mapear tabelas
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public');
    
    structure.tables = tables || [];

    // Mapear views
    const { data: views } = await supabase
      .from('information_schema.views')
      .select('*')
      .eq('table_schema', 'public');
    
    structure.views = views || [];

    // Mapear functions/procedures
    const { data: functions } = await supabase
      .from('information_schema.routines')
      .select('*')
      .eq('routine_schema', 'public');
    
    structure.functions = functions || [];

    // Mapear triggers
    const { data: triggers } = await supabase
      .from('information_schema.triggers')
      .select('*');
    
    structure.triggers = triggers || [];

    // Mapear enums (tipos personalizados)
    const { data: enums } = await supabase
      .from('information_schema.user_defined_types')
      .select('*')
      .eq('user_defined_type_schema', 'public');
    
    structure.enums = enums || [];

    console.log('🗄️ ESTRUTURA DO BANCO MAPEADA');
    console.log('==========================================');
    
    console.log(`📊 TABELAS (${structure.tables.length}):`);
    structure.tables.forEach(table => {
      console.log(`  - ${table.table_name} (${table.table_type})`);
    });

    console.log(`👁️ VIEWS (${structure.views.length}):`);
    structure.views.forEach(view => {
      console.log(`  - ${view.table_name}`);
    });

    console.log(`⚙️ FUNCTIONS (${structure.functions.length}):`);
    structure.functions.forEach(func => {
      console.log(`  - ${func.routine_name} (${func.routine_type})`);
    });

    console.log(`🔄 TRIGGERS (${structure.triggers.length}):`);
    structure.triggers.forEach(trigger => {
      console.log(`  - ${trigger.trigger_name} on ${trigger.event_object_table}`);
    });

    console.log(`🏷️ ENUMS (${structure.enums.length}):`);
    structure.enums.forEach(enumType => {
      console.log(`  - ${enumType.user_defined_type_name}`);
    });

    return structure;

  } catch (error) {
    console.error('❌ Erro ao mapear estrutura:', error);
    throw error;
  }
}

async function generateMappingReport() {
  try {
    const structure = await mapDatabaseStructure();
    
    // Gerar relatório detalhado
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        tables: structure.tables.length,
        views: structure.views.length,
        functions: structure.functions.length,
        triggers: structure.triggers.length,
        enums: structure.enums.length
      },
      details: structure
    };

    // Salvar em arquivo JSON
    const fs = require('fs');
    const path = require('path');
    
    const reportPath = path.join(process.cwd(), 'supabase-structure-map.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Relatório salvo em: ${reportPath}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error);
  }
}

// Executar mapeamento se chamado diretamente
if (require.main === module) {
  generateMappingReport();
}

export { mapDatabaseStructure, generateMappingReport };