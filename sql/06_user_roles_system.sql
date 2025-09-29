-- ========================================
-- SISTEMA DE ROLES E PERMISSÕES
-- ========================================
-- Criado em: 2025-09-26
-- Descrição: Schema completo para controle de acesso baseado em roles

-- 1. ENUM para tipos de roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'manager', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Tabela de profiles (extensão do auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    role user_role NOT NULL DEFAULT 'viewer',
    department TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 3. Tabela de permissões por módulo (granular)
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    resource TEXT NOT NULL, -- 'versions', 'clients', 'modules', 'audit', 'users'
    action TEXT NOT NULL,   -- 'create', 'read', 'update', 'delete', 'manage'
    allowed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(user_id, resource, action)
);

-- 4. Função para auto-criar profile quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        CASE 
            WHEN NEW.email = 'noronhajr_13@hotmail.com' THEN 'super_admin'::user_role
            ELSE 'viewer'::user_role
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger para auto-criar profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- RLS POLICIES
-- ========================================

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Policies para user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can update profiles" ON public.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Super admins can insert profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Policies para user_permissions
CREATE POLICY "Users can view their own permissions" ON public.user_permissions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all permissions" ON public.user_permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can manage permissions" ON public.user_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

-- ========================================
-- FUNÇÕES UTILITÁRIAS
-- ========================================

-- Função para verificar permissão específica
CREATE OR REPLACE FUNCTION public.has_permission(
    user_id_param UUID,
    resource_param TEXT,
    action_param TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    user_role_val user_role;
    permission_exists BOOLEAN := FALSE;
    permission_allowed BOOLEAN := TRUE;
BEGIN
    -- Buscar role do usuário
    SELECT role INTO user_role_val
    FROM public.user_profiles
    WHERE id = user_id_param AND is_active = TRUE;
    
    -- Se não encontrou usuário ou não está ativo
    IF user_role_val IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Super admin tem acesso total
    IF user_role_val = 'super_admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar permissões específicas
    SELECT EXISTS(
        SELECT 1 FROM public.user_permissions
        WHERE user_id = user_id_param 
        AND resource = resource_param 
        AND action = action_param
    ), COALESCE(allowed, TRUE)
    INTO permission_exists, permission_allowed
    FROM public.user_permissions
    WHERE user_id = user_id_param 
    AND resource = resource_param 
    AND action = action_param;
    
    -- Se tem permissão específica, usar ela
    IF permission_exists THEN
        RETURN permission_allowed;
    END IF;
    
    -- Permissões padrão por role
    RETURN CASE 
        WHEN user_role_val = 'admin' THEN TRUE
        WHEN user_role_val = 'manager' AND action IN ('create', 'read', 'update') THEN TRUE
        WHEN user_role_val = 'editor' AND action IN ('create', 'read', 'update') AND resource != 'users' THEN TRUE
        WHEN user_role_val = 'viewer' AND action = 'read' THEN TRUE
        ELSE FALSE
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar usuário com permissões
CREATE OR REPLACE FUNCTION public.get_user_with_permissions(user_id_param UUID)
RETURNS TABLE(
    id UUID,
    email TEXT,
    display_name TEXT,
    role user_role,
    department TEXT,
    avatar_url TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    permissions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.email,
        up.display_name,
        up.role,
        up.department,
        up.avatar_url,
        up.is_active,
        up.created_at,
        up.updated_at,
        up.last_login_at,
        COALESCE(
            (
                SELECT jsonb_object_agg(
                    perm.resource || '_' || perm.action,
                    perm.allowed
                )
                FROM public.user_permissions perm
                WHERE perm.user_id = up.id
            ),
            '{}'::jsonb
        ) as permissions
    FROM public.user_profiles up
    WHERE up.id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- DADOS INICIAIS
-- ========================================

-- Inserir permissões padrão para diferentes roles (se necessário)
-- Isso será feito via interface admin posteriormente

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_resource ON public.user_permissions(user_id, resource);
CREATE INDEX IF NOT EXISTS idx_user_permissions_resource_action ON public.user_permissions(resource, action);

-- ========================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE public.user_profiles IS 'Perfis de usuário com roles e informações estendidas';
COMMENT ON TABLE public.user_permissions IS 'Permissões granulares por usuário e recurso';
COMMENT ON FUNCTION public.has_permission IS 'Verifica se usuário tem permissão específica para recurso/ação';
COMMENT ON FUNCTION public.get_user_with_permissions IS 'Retorna usuário com todas suas permissões agregadas';