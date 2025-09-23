-- Script para adicionar novos campos na tabela versions
-- Data: 2025-09-23
-- Descrição: Adiciona campos powerbuilder_version e exe_path, e renomeia script_executed para scripts

-- 1. Adicionar novos campos
ALTER TABLE versions 
ADD COLUMN powerbuilder_version TEXT,
ADD COLUMN exe_path TEXT;

-- 2. Renomear campo script_executed para scripts
ALTER TABLE versions 
RENAME COLUMN script_executed TO scripts;

-- 3. Atualizar comentários da tabela
COMMENT ON COLUMN versions.powerbuilder_version IS 'Versão do PowerBuilder utilizada';
COMMENT ON COLUMN versions.exe_path IS 'Caminho do arquivo executável';
COMMENT ON COLUMN versions.scripts IS 'Scripts executados (múltiplos caminhos separados por linha)';

-- 4. Verificar a estrutura atualizada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'versions' 
ORDER BY ordinal_position;