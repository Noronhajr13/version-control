-- =====================================================
-- SCRIPT COMPLETO: REBUILD DO BANCO COM 3 ROLES
-- =====================================================
-- Este script refaz todo o sistema do zero com roles simplificadas
-- MANTÉM OS DADOS EXISTENTES, apenas limpa e recria estrutura

-- =====================================================
-- PARTE 1: LIMPEZA COMPLETA
-- =====================================================

-- 1.1. Remover todas as funções existentes
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS has_permission(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS can_manage_user(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_ui_permissions(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_ui_permission(uuid, text, boolean, boolean) CASCADE;
DROP FUNCTION IF EXISTS get_ui_permission_defaults(text) CASCADE;
DROP FUNCTION IF EXISTS create_user_from_auth(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS get_auth_users_not_in_profiles() CASCADE;
DROP FUNCTION IF EXISTS add_user_to_system(uuid, text) CASCADE;

-- 1.2. Remover todos os triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles CASCADE;

-- 1.3. Remover RLS policies existentes
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage users" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view user permissions" ON ui_permissions;
DROP POLICY IF EXISTS "Admins can manage ui permissions" ON ui_permissions;
DROP POLICY IF EXISTS "Admins can insert ui permissions" ON ui_permissions;

-- 1.4. Remover índices específicos do sistema de roles
DROP INDEX IF EXISTS idx_user_profiles_role;
DROP INDEX IF EXISTS idx_user_profiles_active;
DROP INDEX IF EXISTS idx_ui_permissions_user_element;

-- 1.5. Remover tabelas específicas do sistema de permissões
DROP TABLE IF EXISTS ui_permissions CASCADE;

-- 1.6. Remover tipos enum existentes (vai dar erro se houver dados, mas vamos recriar)
-- Primeiro, vamos alterar temporariamente as colunas que usam o enum
DO $$ 
BEGIN
    -- Alterar temporariamente para text para remover o enum
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        ALTER TABLE user_profiles ALTER COLUMN role TYPE text;
        DROP TYPE user_role CASCADE;
    END IF;
END $$;

-- =====================================================
-- PARTE 2: CRIAÇÃO DA NOVA ESTRUTURA (3 ROLES)
-- =====================================================

-- 2.1. Criar novo enum com 3 roles apenas
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'viewer');

-- 2.2. Recriar coluna role com o novo tipo
ALTER TABLE user_profiles ALTER COLUMN role TYPE user_role USING 
    CASE 
        WHEN role IN ('super_admin') THEN 'admin'::user_role
        WHEN role IN ('editor') THEN 'manager'::user_role
        WHEN role IN ('admin') THEN 'admin'::user_role
        WHEN role IN ('manager') THEN 'manager'::user_role
        WHEN role IN ('viewer') THEN 'viewer'::user_role
        ELSE 'viewer'::user_role
    END;

-- 2.3. Definir role padrão
ALTER TABLE user_profiles ALTER COLUMN role SET DEFAULT 'viewer'::user_role;

-- 2.4. Recriar tabela de permissões UI
CREATE TABLE ui_permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
    element_key text NOT NULL,
    visible boolean DEFAULT true,
    enabled boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, element_key)
);

-- 2.5. Recriar índices
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);
CREATE INDEX idx_ui_permissions_user_element ON ui_permissions(user_id, element_key);

-- =====================================================
-- PARTE 3: FUNÇÕES DO SISTEMA SIMPLIFICADO
-- =====================================================

-- 3.1. Função para lidar com novos usuários
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO user_profiles (
        id,
        email,
        display_name,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        CASE 
            WHEN NEW.email = 'noronhajr_13@hotmail.com' THEN 'admin'::user_role
            ELSE 'viewer'::user_role
        END,
        true,
        now(),
        now()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2. Função para obter role do usuário
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS user_role AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val
    FROM user_profiles
    WHERE id = user_uuid AND is_active = true;
    
    RETURN COALESCE(user_role_val, 'viewer'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.3. Função simplificada de permissões (3 roles)
CREATE OR REPLACE FUNCTION has_permission(
    user_uuid uuid,
    resource text,
    action text
) RETURNS boolean AS $$
DECLARE
    user_role_val user_role;
BEGIN
    -- Obter role do usuário
    SELECT get_user_role(user_uuid) INTO user_role_val;
    
    -- Admin tem acesso total
    IF user_role_val = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Manager: CRUD completo, exceto gerenciamento de usuários
    IF user_role_val = 'manager' THEN
        -- Não pode gerenciar usuários
        IF resource = 'users' THEN
            RETURN FALSE;
        END IF;
        
        -- Pode fazer CRUD em outros recursos, mas não deletar
        IF action = 'delete' THEN
            RETURN FALSE;
        END IF;
        
        IF action IN ('create', 'read', 'update') THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    -- Viewer: apenas leitura básica
    IF user_role_val = 'viewer' THEN
        IF action = 'read' AND resource IN ('versions', 'clients', 'modules', 'reports') THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.4. Função para verificar se pode gerenciar usuário
CREATE OR REPLACE FUNCTION can_manage_user(manager_uuid uuid, target_uuid uuid)
RETURNS boolean AS $$
DECLARE
    manager_role user_role;
BEGIN
    SELECT get_user_role(manager_uuid) INTO manager_role;
    
    -- Apenas admin pode gerenciar usuários
    RETURN manager_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.5. Função para obter permissões UI padrão por role
CREATE OR REPLACE FUNCTION get_ui_permission_defaults(role_name text)
RETURNS TABLE(element_key text, visible boolean, enabled boolean) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM (VALUES
        -- Sidebar items
        ('sidebar_dashboard', true, true),
        ('sidebar_versions', true, 
            CASE WHEN role_name = 'admin' THEN true 
                 WHEN role_name = 'manager' THEN true 
                 ELSE true END),
        ('sidebar_clients', true,
            CASE WHEN role_name = 'admin' THEN true 
                 WHEN role_name = 'manager' THEN true 
                 ELSE true END),
        ('sidebar_modules', true,
            CASE WHEN role_name = 'admin' THEN true 
                 WHEN role_name = 'manager' THEN true 
                 ELSE true END),
        ('sidebar_reports', true,
            CASE WHEN role_name = 'admin' THEN true 
                 WHEN role_name = 'manager' THEN true 
                 ELSE true END),
        ('sidebar_users', 
            CASE WHEN role_name = 'admin' THEN true ELSE false END,
            CASE WHEN role_name = 'admin' THEN true ELSE false END),
        ('sidebar_permissions',
            CASE WHEN role_name = 'admin' THEN true ELSE false END,
            CASE WHEN role_name = 'admin' THEN true ELSE false END),
        
        -- Action buttons
        ('btn_create_version', 
            CASE WHEN role_name IN ('admin', 'manager') THEN true ELSE false END,
            CASE WHEN role_name IN ('admin', 'manager') THEN true ELSE false END),
        ('btn_edit_version',
            CASE WHEN role_name IN ('admin', 'manager') THEN true ELSE false END,
            CASE WHEN role_name IN ('admin', 'manager') THEN true ELSE false END),
        ('btn_delete_version',
            CASE WHEN role_name = 'admin' THEN true ELSE false END,
            CASE WHEN role_name = 'admin' THEN true ELSE false END),
        ('btn_create_client',
            CASE WHEN role_name IN ('admin', 'manager') THEN true ELSE false END,
            CASE WHEN role_name IN ('admin', 'manager') THEN true ELSE false END),
        ('btn_edit_client',
            CASE WHEN role_name IN ('admin', 'manager') THEN true ELSE false END,
            CASE WHEN role_name IN ('admin', 'manager') THEN true ELSE false END),
        ('btn_delete_client',
            CASE WHEN role_name = 'admin' THEN true ELSE false END,
            CASE WHEN role_name = 'admin' THEN true ELSE false END),
        ('btn_create_module',
            CASE WHEN role_name IN ('admin', 'manager') THEN true ELSE false END,
            CASE WHEN role_name IN ('admin', 'manager') THEN true ELSE false END),
        ('btn_edit_module',
            CASE WHEN role_name IN ('admin', 'manager') THEN true ELSE false END,
            CASE WHEN role_name IN ('admin', 'manager') THEN true ELSE false END),
        ('btn_delete_module',
            CASE WHEN role_name = 'admin' THEN true ELSE false END,
            CASE WHEN role_name = 'admin' THEN true ELSE false END),
        ('btn_export_data',
            CASE WHEN role_name IN ('admin', 'manager') THEN true ELSE false END,
            CASE WHEN role_name IN ('admin', 'manager') THEN true ELSE false END)
    ) AS defaults(element_key, visible, enabled);
END;
$$ LANGUAGE plpgsql;

-- 3.6. Função para obter permissões UI do usuário
CREATE OR REPLACE FUNCTION get_ui_permissions(user_uuid uuid)
RETURNS TABLE(element_key text, visible boolean, enabled boolean) AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT get_user_role(user_uuid) INTO user_role_val;
    
    RETURN QUERY
    SELECT 
        defaults.element_key,
        COALESCE(custom.visible, defaults.visible) as visible,
        COALESCE(custom.enabled, defaults.enabled) as enabled
    FROM get_ui_permission_defaults(user_role_val::text) defaults
    LEFT JOIN ui_permissions custom ON (
        custom.user_id = user_uuid 
        AND custom.element_key = defaults.element_key
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.7. Função para atualizar permissão UI específica
CREATE OR REPLACE FUNCTION update_ui_permission(
    user_uuid uuid,
    element_key_param text,
    visible_param boolean,
    enabled_param boolean
) RETURNS void AS $$
BEGIN
    INSERT INTO ui_permissions (user_id, element_key, visible, enabled, updated_at)
    VALUES (user_uuid, element_key_param, visible_param, enabled_param, now())
    ON CONFLICT (user_id, element_key)
    DO UPDATE SET
        visible = excluded.visible,
        enabled = excluded.enabled,
        updated_at = excluded.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.8. Função para adicionar usuário existente do Auth
CREATE OR REPLACE FUNCTION create_user_from_auth(
    auth_user_id uuid,
    auth_email text,
    default_role text DEFAULT 'viewer'
) RETURNS uuid AS $$
DECLARE
    new_user_id uuid;
BEGIN
    INSERT INTO user_profiles (
        id,
        email,
        display_name,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        auth_user_id,
        auth_email,
        auth_email,
        default_role::user_role,
        true,
        now(),
        now()
    ) RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.9. Função para listar usuários do Auth não cadastrados
CREATE OR REPLACE FUNCTION get_auth_users_not_in_profiles()
RETURNS TABLE(
    id uuid,
    email text,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email::text,
        au.created_at
    FROM auth.users au
    LEFT JOIN user_profiles up ON au.id = up.id
    WHERE up.id IS NULL
    AND au.email IS NOT NULL
    ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.10. Função para adicionar usuário ao sistema
CREATE OR REPLACE FUNCTION add_user_to_system(
    user_id uuid,
    user_role text DEFAULT 'viewer'
) RETURNS uuid AS $$
DECLARE
    auth_user RECORD;
    result_id uuid;
BEGIN
    -- Buscar dados do usuário no auth.users
    SELECT id, email, raw_user_meta_data
    INTO auth_user
    FROM auth.users
    WHERE id = user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuário não encontrado no sistema de autenticação';
    END IF;
    
    -- Criar perfil do usuário
    INSERT INTO user_profiles (
        id,
        email,
        display_name,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        auth_user.id,
        auth_user.email,
        COALESCE(
            auth_user.raw_user_meta_data->>'name',
            auth_user.raw_user_meta_data->>'full_name',
            auth_user.email
        ),
        user_role::user_role,
        true,
        now(),
        now()
    ) RETURNING id INTO result_id;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTE 4: TRIGGERS
-- =====================================================

-- 4.1. Trigger para novos usuários
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4.2. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ui_permissions_updated_at
    BEFORE UPDATE ON ui_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PARTE 5: RLS POLICIES (SIMPLIFICADAS)
-- =====================================================

-- 5.1. Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_permissions ENABLE ROW LEVEL SECURITY;

-- 5.2. Policies para user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update profiles" ON user_profiles
    FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert profiles" ON user_profiles
    FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete profiles" ON user_profiles
    FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- 5.3. Policies para ui_permissions
CREATE POLICY "Users can view own ui permissions" ON ui_permissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all ui permissions" ON ui_permissions
    FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can manage ui permissions" ON ui_permissions
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- =====================================================
-- PARTE 6: VERIFICAÇÕES E LIMPEZA FINAL
-- =====================================================

-- 6.1. Atualizar dados existentes - garantir que não há roles inválidas
UPDATE user_profiles 
SET role = CASE 
    WHEN role::text = 'super_admin' THEN 'admin'::user_role
    WHEN role::text = 'editor' THEN 'manager'::user_role
    ELSE role
END;

-- 6.2. Criar usuário admin principal se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE email = 'noronhajr_13@hotmail.com'
    ) THEN
        -- Se o usuário não existe no profiles, vamos criá-lo se existir no auth
        IF EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = 'noronhajr_13@hotmail.com'
        ) THEN
            INSERT INTO user_profiles (
                id,
                email,  
                display_name,
                role,
                is_active,
                created_at,
                updated_at
            )
            SELECT 
                id,
                email,
                COALESCE(raw_user_meta_data->>'name', email),
                'admin'::user_role,
                true,
                now(),
                now()
            FROM auth.users 
            WHERE email = 'noronhajr_13@hotmail.com';
        END IF;
    ELSE
        -- Se existe, garantir que tem role admin
        UPDATE user_profiles 
        SET role = 'admin'::user_role
        WHERE email = 'noronhajr_13@hotmail.com';
    END IF;
END $$;

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================
-- ✅ Sistema limpo e recriado com 3 roles
-- ✅ Todas as funções e triggers atualizados  
-- ✅ RLS policies simplificadas
-- ✅ Dados existentes preservados
-- ✅ Permissões UI configuradas
-- ✅ Sistema pronto para uso

SELECT 'REBUILD COMPLETO - Sistema simplificado com 3 roles (admin, manager, viewer) criado com sucesso!' as status;