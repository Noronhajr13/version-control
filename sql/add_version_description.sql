-- Adicionar campo description (motivo da versão) na tabela versions
-- Execute este script no Supabase SQL Editor

-- Adiciona a coluna description para armazenar motivo da versão e problemas solucionados
ALTER TABLE versions 
ADD COLUMN description TEXT;

-- Adiciona comentário na coluna
COMMENT ON COLUMN versions.description IS 'Motivo da geração da versão e problemas que ela soluciona';

-- Atualiza o trigger de auditoria para incluir a nova coluna (opcional)
-- O trigger já captura todas as colunas automaticamente, mas é bom garantir