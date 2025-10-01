-- =====================================================
-- SCRIPT DE DIAGNÓSTICO E LIMPEZA DA BASE DE DADOS
-- =====================================================
-- 
-- Este script verifica a estrutura atual e pode limpar
-- tabelas/funções problemáticas se necessário
--
-- INSTRUÇÕES:
-- 1. Execute este script primeiro para ver o estado atual
-- 2. Se necessário, descomente as seções de limpeza
-- 3. Depois execute COMPLETE_DATABASE_SETUP.sql
-- =====================================================

-- =====================================================
-- 1. DIAGNÓSTICO - VERIFICAR ESTADO ATUAL
-- =====================================================

-- Verificar tabelas existentes
SELECT 
    'TABELAS' as tipo,
    table_name as nome,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'modules', 'clients', 'versions', 'version_clients', 'cards')
ORDER BY table_name;

-- Verificar colunas das tabelas principais
SELECT 
    'COLUNAS' as tipo,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'modules', 'clients', 'versions', 'version_clients', 'cards')
ORDER BY table_name, ordinal_position;

-- Verificar funções existentes
SELECT 
    'FUNÇÕES' as tipo,
    routine_name as nome,
    routine_type as tipo_funcao
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('update_updated_at_column', 'handle_new_user', 'get_system_stats', 'check_user_permission')
ORDER BY routine_name;

-- Verificar triggers existentes
SELECT 
    'TRIGGERS' as tipo,
    trigger_name as nome,
    event_object_table as tabela,
    action_timing as momento,
    event_manipulation as evento
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Verificar políticas RLS
SELECT 
    'POLÍTICAS RLS' as tipo,
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar índices
SELECT 
    'ÍNDICES' as tipo,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'modules', 'clients', 'versions', 'version_clients', 'cards')
ORDER BY tablename, indexname;

-- Verificar dados existentes (contagem)
DO $$
DECLARE
    table_name TEXT;
    count_query TEXT;
    table_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 CONTAGEM DE DADOS EXISTENTES:';
    RAISE NOTICE '================================';
    
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_name IN ('user_profiles', 'modules', 'clients', 'versions', 'version_clients', 'cards')
    LOOP
        count_query := 'SELECT COUNT(*) FROM ' || table_name;
        EXECUTE count_query INTO table_count;
        RAISE NOTICE '📋 %: % registros', table_name, table_count;
    END LOOP;
END $$;

-- =====================================================
-- 2. LIMPEZA (DESCOMENTE SE NECESSÁRIO)
-- =====================================================

-- ⚠️ ATENÇÃO: As seções abaixo irão APAGAR dados!
-- Descomente apenas se tiver certeza que quer limpar tudo

/*
-- Dropar triggers primeiro
DROP TRIGGER IF EXISTS trigger_updated_at_user_profiles ON user_profiles;
DROP TRIGGER IF EXISTS trigger_updated_at_modules ON modules;
DROP TRIGGER IF EXISTS trigger_updated_at_clients ON clients;
DROP TRIGGER IF EXISTS trigger_updated_at_versions ON versions;
DROP TRIGGER IF EXISTS trigger_updated_at_cards ON cards;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Dropar políticas RLS
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON user_profiles;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON modules;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON clients;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON versions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON version_clients;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON cards;

-- Dropar tabelas em ordem correta (respeitando foreign keys)
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS version_clients CASCADE;
DROP TABLE IF EXISTS versions CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Dropar funções
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_system_stats() CASCADE;
DROP FUNCTION IF EXISTS check_user_permission(UUID, TEXT) CASCADE;
*/

-- =====================================================
-- 3. LIMPEZA SELETIVA (MAIS SEGURA)
-- =====================================================

-- Se você só quer limpar os dados mas manter a estrutura:
/*
TRUNCATE TABLE cards CASCADE;
TRUNCATE TABLE version_clients CASCADE;
TRUNCATE TABLE versions CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE modules CASCADE;
-- Cuidado com user_profiles - pode quebrar autenticação
-- TRUNCATE TABLE user_profiles CASCADE;
*/

-- =====================================================
-- 4. VERIFICAÇÃO DE CONFLITOS
-- =====================================================

-- Verificar se há conflitos de nomes/estruturas que podem impedir o setup
DO $$
DECLARE
    issues_found INTEGER := 0;
    msg TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICANDO POSSÍVEIS CONFLITOS:';
    RAISE NOTICE '==================================';
    
    -- Verificar se user_profiles tem estrutura incompatível
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'role' 
        AND data_type != 'text'
    ) THEN
        RAISE NOTICE '⚠️ Coluna role em user_profiles tem tipo incompatível';
        issues_found := issues_found + 1;
    END IF;
    
    -- Verificar se há FKs problemáticas
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name IN ('modules', 'clients', 'versions', 'version_clients', 'cards')
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE NOTICE '✅ Foreign Keys existentes encontradas (normal)';
    END IF;
    
    -- Verificar se há dados que podem causar conflitos de UNIQUE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modules') THEN
        EXECUTE 'SELECT COUNT(*) FROM (SELECT name, COUNT(*) FROM modules GROUP BY name HAVING COUNT(*) > 1) duplicates' INTO issues_found;
        IF issues_found > 0 THEN
            RAISE NOTICE '⚠️ % módulos com nomes duplicados encontrados', issues_found;
        END IF;
    END IF;
    
    IF issues_found = 0 THEN
        RAISE NOTICE '✅ Nenhum conflito crítico encontrado!';
        RAISE NOTICE '✅ Pode executar COMPLETE_DATABASE_SETUP.sql com segurança';
    ELSE
        RAISE NOTICE '⚠️ % conflitos encontrados. Considere limpeza antes do setup', issues_found;
    END IF;
END $$;

-- =====================================================
-- 5. INSTRUÇÕES FINAIS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 PRÓXIMOS PASSOS RECOMENDADOS:';
    RAISE NOTICE '==============================';
    RAISE NOTICE '1. ✅ Analise os resultados acima';
    RAISE NOTICE '2. 🔧 Se houver conflitos, descomente a seção de LIMPEZA';
    RAISE NOTICE '3. 🚀 Execute COMPLETE_DATABASE_SETUP.sql';
    RAISE NOTICE '4. 🌐 Use /database-setup no seu app para criar usuário admin';
    RAISE NOTICE '5. 🎉 Teste o login em /auth/login';
    RAISE NOTICE '';
END $$;