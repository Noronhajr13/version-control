-- Adicionar novos campos na tabela versions: status e data_generation
-- Execute este script no Supabase SQL Editor

-- Adiciona enum para status da versão
CREATE TYPE version_status AS ENUM ('interna', 'testes', 'producao');

-- Adiciona as colunas status e data_generation
ALTER TABLE versions 
ADD COLUMN status version_status DEFAULT 'interna',
ADD COLUMN data_generation DATE;

-- Adiciona comentários nas colunas
COMMENT ON COLUMN versions.status IS 'Status da versão: interna, testes ou produção';
COMMENT ON COLUMN versions.data_generation IS 'Data em que a versão foi gerada';

-- Cria índices para otimizar consultas com agrupamento
CREATE INDEX idx_versions_module_status ON versions(module_id, status);
CREATE INDEX idx_versions_powerbuilder_status ON versions(powerbuilder_version, status) WHERE powerbuilder_version IS NOT NULL;