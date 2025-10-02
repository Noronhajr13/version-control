-- ========================================
-- SCRIPT: Funções RPC para Supabase
-- Descrição: Criação das funções get_user_stats e get_user_ui_permissions
-- Data: 2025-09-30
-- ========================================

-- 1. FUNÇÃO: get_user_stats
-- Descrição: Retorna estatísticas dos usuários do sistema
-- ========================================

CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_users', (
            SELECT COUNT(*) 
            FROM auth.users
        ),
        'active_profiles', (
            SELECT COUNT(*) 
            FROM user_profiles 
            WHERE is_active = true
        ),
        'inactive_profiles', (
            SELECT COUNT(*) 
            FROM user_profiles 
            WHERE is_active = false
        ),
        'unregistered_users', (
            SELECT COUNT(*) 
            FROM auth.users u 
            LEFT JOIN user_profiles p ON u.id = p.id 
            WHERE p.id IS NULL
        ),
        'profiles_by_role', (
            SELECT json_object_agg(role, count)
            FROM (
                SELECT role, COUNT(*) as count
                FROM user_profiles
                GROUP BY role
            ) role_counts
        ),
        'recent_logins', (
            SELECT COUNT(*)
            FROM user_profiles
            WHERE last_login_at > NOW() - INTERVAL '7 days'
        ),
        'profiles_by_department', (
            SELECT json_object_agg(
                COALESCE(department, 'Sem Departamento'), 
                count
            )
            FROM (
                SELECT 
                    COALESCE(department, 'Sem Departamento') as department, 
                    COUNT(*) as count
                FROM user_profiles
                GROUP BY department
            ) dept_counts
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- ========================================
-- 2. FUNÇÃO: get_user_ui_permissions
-- Descrição: Retorna permissões de UI para um usuário específico
-- ========================================

CREATE OR REPLACE FUNCTION get_user_ui_permissions(user_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role text;
    result json;
BEGIN
    -- Buscar role do usuário
    SELECT role INTO user_role
    FROM user_profiles
    WHERE id = user_id_param;
    
    -- Se não encontrou perfil, assumir viewer
    IF user_role IS NULL THEN
        user_role := 'viewer';
    END IF;
    
    -- Definir permissões baseadas no role
    CASE user_role
        WHEN 'super_admin' THEN
            result := json_build_object(
                'can_view_dashboard', true,
                'can_view_users', true,
                'can_create_users', true,
                'can_edit_users', true,
                'can_delete_users', true,
                'can_view_modules', true,
                'can_create_modules', true,
                'can_edit_modules', true,
                'can_delete_modules', true,
                'can_view_clients', true,
                'can_create_clients', true,
                'can_edit_clients', true,
                'can_delete_clients', true,
                'can_view_versions', true,
                'can_create_versions', true,
                'can_edit_versions', true,
                'can_delete_versions', true,
                'can_view_reports', true,
                'can_view_audit', true,
                'can_view_permissions', true,
                'can_edit_permissions', true,
                'can_view_diagnostics', true,
                'can_view_database_analysis', true,
                'can_manage_database', true
            );
        WHEN 'admin' THEN
            result := json_build_object(
                'can_view_dashboard', true,
                'can_view_users', true,
                'can_create_users', true,
                'can_edit_users', true,
                'can_delete_users', false,
                'can_view_modules', true,
                'can_create_modules', true,
                'can_edit_modules', true,
                'can_delete_modules', true,
                'can_view_clients', true,
                'can_create_clients', true,
                'can_edit_clients', true,
                'can_delete_clients', true,
                'can_view_versions', true,
                'can_create_versions', true,
                'can_edit_versions', true,
                'can_delete_versions', true,
                'can_view_reports', true,
                'can_view_audit', true,
                'can_view_permissions', true,
                'can_edit_permissions', false,
                'can_view_diagnostics', true,
                'can_view_database_analysis', false,
                'can_manage_database', false
            );
        WHEN 'manager' THEN
            result := json_build_object(
                'can_view_dashboard', true,
                'can_view_users', false,
                'can_create_users', false,
                'can_edit_users', false,
                'can_delete_users', false,
                'can_view_modules', true,
                'can_create_modules', true,
                'can_edit_modules', true,
                'can_delete_modules', false,
                'can_view_clients', true,
                'can_create_clients', true,
                'can_edit_clients', true,
                'can_delete_clients', false,
                'can_view_versions', true,
                'can_create_versions', true,
                'can_edit_versions', true,
                'can_delete_versions', false,
                'can_view_reports', true,
                'can_view_audit', false,
                'can_view_permissions', false,
                'can_edit_permissions', false,
                'can_view_diagnostics', false,
                'can_view_database_analysis', false,
                'can_manage_database', false
            );
        WHEN 'editor' THEN
            result := json_build_object(
                'can_view_dashboard', true,
                'can_view_users', false,
                'can_create_users', false,
                'can_edit_users', false,
                'can_delete_users', false,
                'can_view_modules', true,
                'can_create_modules', false,
                'can_edit_modules', true,
                'can_delete_modules', false,
                'can_view_clients', true,
                'can_create_clients', false,
                'can_edit_clients', true,
                'can_delete_clients', false,
                'can_view_versions', true,
                'can_create_versions', true,
                'can_edit_versions', true,
                'can_delete_versions', false,
                'can_view_reports', true,
                'can_view_audit', false,
                'can_view_permissions', false,
                'can_edit_permissions', false,
                'can_view_diagnostics', false,
                'can_view_database_analysis', false,
                'can_manage_database', false
            );
        ELSE -- 'viewer' ou qualquer outro
            result := json_build_object(
                'can_view_dashboard', true,
                'can_view_users', false,
                'can_create_users', false,
                'can_edit_users', false,
                'can_delete_users', false,
                'can_view_modules', true,
                'can_create_modules', false,
                'can_edit_modules', false,
                'can_delete_modules', false,
                'can_view_clients', true,
                'can_create_clients', false,
                'can_edit_clients', false,
                'can_delete_clients', false,
                'can_view_versions', true,
                'can_create_versions', false,
                'can_edit_versions', false,
                'can_delete_versions', false,
                'can_view_reports', true,
                'can_view_audit', false,
                'can_view_permissions', false,
                'can_edit_permissions', false,
                'can_view_diagnostics', false,
                'can_view_database_analysis', false,
                'can_manage_database', false
            );
    END CASE;
    
    RETURN result;
END;
$$;

-- ========================================
-- 3. FUNÇÃO: get_user_with_permissions (opcional - caso queira recriar)
-- Descrição: Retorna dados do usuário com permissões incluídas
-- ========================================

CREATE OR REPLACE FUNCTION get_user_with_permissions(user_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_data json;
    user_permissions json;
    result json;
BEGIN
    -- Buscar dados do usuário
    SELECT to_json(up.*) INTO user_data
    FROM user_profiles up
    WHERE up.id = user_id_param;
    
    -- Se não encontrou perfil, retornar null
    IF user_data IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Buscar permissões
    SELECT get_user_ui_permissions(user_id_param) INTO user_permissions;
    
    -- Combinar dados do usuário com permissões
    result := user_data || json_build_object('permissions', user_permissions);
    
    RETURN result;
END;
$$;

-- ========================================
-- 4. CONCEDER PERMISSÕES
-- ========================================

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION get_user_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_ui_permissions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_with_permissions(uuid) TO authenticated;

-- ========================================
-- 5. POLÍTICAS RLS (Row Level Security)
-- ========================================

-- Permitir que usuários executem as funções
-- (As funções são SECURITY DEFINER, então executam com privilégios do owner)

-- ========================================
-- 6. TESTES DAS FUNÇÕES
-- ========================================

-- Teste get_user_stats (deve funcionar para qualquer usuário autenticado)
-- SELECT get_user_stats();

-- Teste get_user_ui_permissions (substitua pelo UUID real)
-- SELECT get_user_ui_permissions('seu-user-id-aqui'::uuid);

-- Teste get_user_with_permissions (substitua pelo UUID real)
-- SELECT get_user_with_permissions('seu-user-id-aqui'::uuid);

-- ========================================
-- FINALIZADO: Funções RPC criadas com sucesso!
-- ========================================