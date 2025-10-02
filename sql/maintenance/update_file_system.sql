-- =====================================================
-- SCRIPT: ATUALIZAR CAMPO DE ARQUIVO PARA ZIP DOWNLOAD
-- =====================================================
-- Este script modifica o campo exe_path para file_path e configura storage

-- PASSO 1: Verificar estrutura atual da tabela versions
SELECT 'ESTRUTURA ATUAL DA TABELA VERSIONS:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'versions' 
AND table_schema = 'public';

-- PASSO 2: Adicionar novo campo file_path se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'versions' 
        AND column_name = 'file_path'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE versions ADD COLUMN file_path text;
        RAISE NOTICE 'Campo file_path adicionado à tabela versions';
    ELSE
        RAISE NOTICE 'Campo file_path já existe na tabela versions';
    END IF;
END $$;

-- PASSO 3: Migrar dados do exe_path para file_path (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'versions' 
        AND column_name = 'exe_path'
        AND table_schema = 'public'
    ) THEN
        -- Migrar dados existentes
        UPDATE versions 
        SET file_path = exe_path 
        WHERE exe_path IS NOT NULL AND exe_path != '';
        
        RAISE NOTICE 'Dados migrados de exe_path para file_path';
        
        -- Remover campo antigo
        ALTER TABLE versions DROP COLUMN IF EXISTS exe_path;
        RAISE NOTICE 'Campo exe_path removido';
    ELSE
        RAISE NOTICE 'Campo exe_path não existe, não há dados para migrar';
    END IF;
END $$;

-- PASSO 4: Criar bucket de storage para arquivos de versão (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'version-files',
    'version-files',
    true,
    104857600, -- 100MB em bytes
    ARRAY['application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/x-7z-compressed']
) 
ON CONFLICT (id) DO NOTHING;

-- PASSO 5: Configurar RLS policies para o bucket
-- NOTA: As políticas de storage devem ser criadas manualmente no Dashboard do Supabase
-- ou via interface administrativa. Este script criará apenas a estrutura básica.

-- Remover políticas existentes se já existirem
DROP POLICY IF EXISTS "version-files-select" ON storage.objects;
DROP POLICY IF EXISTS "version-files-insert" ON storage.objects;
DROP POLICY IF EXISTS "version-files-update" ON storage.objects;
DROP POLICY IF EXISTS "version-files-delete" ON storage.objects;

-- Criar políticas RLS para storage.objects
CREATE POLICY "version-files-select" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'version-files' AND
        auth.uid() IN (
            SELECT id FROM user_profiles 
            WHERE role IN ('admin', 'manager', 'viewer') 
            AND is_active = true
        )
    );

CREATE POLICY "version-files-insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'version-files' AND
        auth.uid() IN (
            SELECT id FROM user_profiles 
            WHERE role IN ('admin', 'manager') 
            AND is_active = true
        )
    );

CREATE POLICY "version-files-update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'version-files' AND
        auth.uid() IN (
            SELECT id FROM user_profiles 
            WHERE role IN ('admin', 'manager') 
            AND is_active = true
        )
    );

CREATE POLICY "version-files-delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'version-files' AND
        auth.uid() IN (
            SELECT id FROM user_profiles 
            WHERE role = 'admin' 
            AND is_active = true
        )
    );

-- PASSO 6: Verificar se tabela version_clients já existe (não criar duplicada)
-- A tabela version_clients já existe no sistema e será utilizada

-- PASSO 7: Verificar resultado final
SELECT 'ESTRUTURA ATUALIZADA DA TABELA VERSIONS:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'versions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar bucket criado
SELECT 'BUCKET DE STORAGE CRIADO:' as info;
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'version-files';

-- Verificar tabela version_clients existente
SELECT 'TABELA VERSION_CLIENTS (EXISTENTE):' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'version_clients' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '✅ ATUALIZAÇÃO CONCLUÍDA!' as resultado;
SELECT '📦 Campo file_path configurado para arquivos ZIP' as info1;
SELECT '🔒 Storage bucket com RLS configurado' as info2;
SELECT '🔗 Utilizando tabela version_clients existente' as info3;