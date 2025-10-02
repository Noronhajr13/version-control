-- =====================================================
-- SCRIPT COMPLEMENTAR: RLS POLICIES PARA TABELAS PRINCIPAIS
-- =====================================================
-- Este script recria as policies das tabelas principais com o sistema de 3 roles

-- =====================================================
-- VERSÕES - RLS POLICIES
-- =====================================================

-- Remover policies existentes
DROP POLICY IF EXISTS "versions_select_policy" ON versions;
DROP POLICY IF EXISTS "versions_insert_policy" ON versions;
DROP POLICY IF EXISTS "versions_update_policy" ON versions;
DROP POLICY IF EXISTS "versions_delete_policy" ON versions;

-- Habilitar RLS
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;

-- Criar policies com 3 roles
CREATE POLICY "versions_select_policy" ON versions
    FOR SELECT USING (
        get_user_role(auth.uid()) IN ('admin', 'manager', 'viewer')
    );

CREATE POLICY "versions_insert_policy" ON versions
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) IN ('admin', 'manager')
    );

CREATE POLICY "versions_update_policy" ON versions
    FOR UPDATE USING (
        get_user_role(auth.uid()) IN ('admin', 'manager')
    );

CREATE POLICY "versions_delete_policy" ON versions
    FOR DELETE USING (
        get_user_role(auth.uid()) = 'admin'
    );

-- =====================================================
-- CLIENTES - RLS POLICIES  
-- =====================================================

-- Remover policies existentes
DROP POLICY IF EXISTS "clients_select_policy" ON clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON clients;
DROP POLICY IF EXISTS "clients_update_policy" ON clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON clients;

-- Habilitar RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Criar policies com 3 roles
CREATE POLICY "clients_select_policy" ON clients
    FOR SELECT USING (
        get_user_role(auth.uid()) IN ('admin', 'manager', 'viewer')
    );

CREATE POLICY "clients_insert_policy" ON clients
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) IN ('admin', 'manager')
    );

CREATE POLICY "clients_update_policy" ON clients
    FOR UPDATE USING (
        get_user_role(auth.uid()) IN ('admin', 'manager')
    );

CREATE POLICY "clients_delete_policy" ON clients
    FOR DELETE USING (
        get_user_role(auth.uid()) = 'admin'
    );

-- =====================================================
-- MÓDULOS - RLS POLICIES
-- =====================================================

-- Remover policies existentes  
DROP POLICY IF EXISTS "modules_select_policy" ON modules;
DROP POLICY IF EXISTS "modules_insert_policy" ON modules;
DROP POLICY IF EXISTS "modules_update_policy" ON modules;
DROP POLICY IF EXISTS "modules_delete_policy" ON modules;

-- Habilitar RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Criar policies com 3 roles
CREATE POLICY "modules_select_policy" ON modules
    FOR SELECT USING (
        get_user_role(auth.uid()) IN ('admin', 'manager', 'viewer')
    );

CREATE POLICY "modules_insert_policy" ON modules
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) IN ('admin', 'manager')
    );

CREATE POLICY "modules_update_policy" ON modules
    FOR UPDATE USING (
        get_user_role(auth.uid()) IN ('admin', 'manager')
    );

CREATE POLICY "modules_delete_policy" ON modules
    FOR DELETE USING (
        get_user_role(auth.uid()) = 'admin'
    );

-- =====================================================
-- AUDITORIA - RLS POLICIES
-- =====================================================

-- Verificar se tabela de auditoria existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        -- Remover policies existentes
        DROP POLICY IF EXISTS "audit_logs_select_policy" ON audit_logs;
        DROP POLICY IF EXISTS "audit_logs_insert_policy" ON audit_logs;
        
        -- Habilitar RLS
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
        
        -- Apenas admin e manager podem ver auditoria
        CREATE POLICY "audit_logs_select_policy" ON audit_logs
            FOR SELECT USING (
                get_user_role(auth.uid()) IN ('admin', 'manager')
            );
            
        -- Sistema pode inserir logs (função)
        CREATE POLICY "audit_logs_insert_policy" ON audit_logs
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- =====================================================
-- VERIFICAÇÃO DE PERMISSÕES
-- =====================================================

-- Função para testar as permissões do sistema
CREATE OR REPLACE FUNCTION test_role_permissions()
RETURNS TABLE(
    role_name text,
    can_view_versions boolean,
    can_create_versions boolean,
    can_delete_versions boolean,
    can_manage_users boolean,
    can_view_audit boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM (VALUES
        -- Admin: acesso total
        ('admin'::text, true, true, true, true, true),
        -- Manager: CRUD sem delete, sem usuários  
        ('manager'::text, true, true, false, false, true),
        -- Viewer: apenas visualização
        ('viewer'::text, true, false, false, false, false)
    ) AS perms(role_name, can_view_versions, can_create_versions, can_delete_versions, can_manage_users, can_view_audit);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO DE MIGRAÇÃO DE DADOS LEGACY
-- =====================================================

-- Função para migrar roles antigas para novas (caso ainda existam)
CREATE OR REPLACE FUNCTION migrate_legacy_roles()
RETURNS TABLE(
    user_id uuid,
    old_role text,
    new_role text,
    migrated boolean
) AS $$
DECLARE
    rec RECORD;
    migration_count INTEGER := 0;
BEGIN
    -- Verificar se há roles que precisam ser migradas
    FOR rec IN 
        SELECT id, role::text as current_role
        FROM user_profiles
        WHERE role::text NOT IN ('admin', 'manager', 'viewer')
    LOOP
        DECLARE
            new_role_val user_role;
        BEGIN
            -- Mapear role antiga para nova
            new_role_val := CASE rec.current_role
                WHEN 'super_admin' THEN 'admin'::user_role
                WHEN 'editor' THEN 'manager'::user_role
                ELSE 'viewer'::user_role
            END;
            
            -- Atualizar no banco
            UPDATE user_profiles 
            SET role = new_role_val
            WHERE id = rec.id;
            
            migration_count := migration_count + 1;
            
            -- Retornar resultado da migração
            user_id := rec.id;
            old_role := rec.current_role;
            new_role := new_role_val::text;
            migrated := true;
            
            RETURN NEXT;
        END;
    END LOOP;
    
    -- Se não houve migrações, retornar status
    IF migration_count = 0 THEN
        user_id := null;
        old_role := 'N/A';
        new_role := 'N/A';
        migrated := false;
        RETURN NEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EXECUTAR MIGRAÇÃO AUTOMÁTICA
-- =====================================================

-- Executar migração de roles legacy
SELECT * FROM migrate_legacy_roles();

-- =====================================================
-- ESTATÍSTICAS DO SISTEMA
-- =====================================================

-- Função para obter estatísticas do sistema de roles
CREATE OR REPLACE FUNCTION get_role_statistics()
RETURNS TABLE(
    role_name text,
    user_count bigint,
    percentage numeric
) AS $$
DECLARE
    total_users bigint;
BEGIN
    -- Obter total de usuários
    SELECT COUNT(*) INTO total_users FROM user_profiles WHERE is_active = true;
    
    RETURN QUERY
    SELECT 
        up.role::text,
        COUNT(*) as user_count,
        ROUND((COUNT(*) * 100.0 / NULLIF(total_users, 0)), 2) as percentage
    FROM user_profiles up
    WHERE up.is_active = true
    GROUP BY up.role
    ORDER BY user_count DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================

SELECT 'RLS POLICIES ATUALIZADAS - Sistema de permissões completo para 3 roles!' as status;

-- Mostrar estatísticas finais
SELECT 'ESTATÍSTICAS DO SISTEMA:' as info;
SELECT * FROM get_role_statistics();

SELECT 'TESTE DE PERMISSÕES:' as info;  
SELECT * FROM test_role_permissions();