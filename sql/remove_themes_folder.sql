-- Migration: Remove themes_folder column from versions table
-- Execute este script no Supabase SQL Editor

-- Remove a coluna themes_folder da tabela versions
ALTER TABLE versions DROP COLUMN IF EXISTS themes_folder;

-- Comentário: Campo themes_folder removido pois não há mais necessidade deste campo
-- conforme solicitação do usuário. O campo exe_path agora será usado para 
-- links do SharePoint ao invés de caminhos locais.