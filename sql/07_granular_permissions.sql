-- ========================================
-- SISTEMA DE PERMISSÕES GRANULARES - UI ELEMENTS
-- ========================================
-- Criado em: 2025-09-29
-- Descrição: Extensão do sistema de roles para controle granular de elementos de UI

-- 1. Tabela para definir elementos de UI controláveis
CREATE TABLE IF NOT EXISTS public.ui_elements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    element_key TEXT NOT NULL UNIQUE, -- 'sidebar_modules', 'button_create_version', etc.
    element_name TEXT NOT NULL,       -- Nome amigável: 'Menu Módulos', 'Botão Criar Versão'
    element_type TEXT NOT NULL,       -- 'menu', 'button', 'section', 'feature'
    parent_resource TEXT,             -- 'modules', 'versions', 'clients', etc.
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT valid_element_type CHECK (element_type IN ('menu', 'button', 'section', 'feature'))
);

-- 2. Tabela para permissões específicas de UI por usuário
CREATE TABLE IF NOT EXISTS public.user_ui_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    ui_element_id UUID NOT NULL REFERENCES public.ui_elements(id) ON DELETE CASCADE,
    is_visible BOOLEAN DEFAULT TRUE,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(user_id, ui_element_id)
);

-- 3. Inserir elementos de UI padrão
INSERT INTO public.ui_elements (element_key, element_name, element_type, parent_resource, description) VALUES
-- Menus do Sidebar
('sidebar_dashboard', 'Menu Dashboard', 'menu', null, 'Acesso ao dashboard principal'),
('sidebar_modules', 'Menu Módulos', 'menu', 'modules', 'Acesso ao menu de módulos'),
('sidebar_clients', 'Menu Clientes', 'menu', 'clients', 'Acesso ao menu de clientes'),
('sidebar_versions', 'Menu Versões', 'menu', 'versions', 'Acesso ao menu de versões'),
('sidebar_reports', 'Menu Relatórios', 'menu', 'reports', 'Acesso ao menu de relatórios'),
('sidebar_audit', 'Menu Auditoria', 'menu', 'audit', 'Acesso ao menu de auditoria'),
('sidebar_users', 'Menu Usuários', 'menu', 'users', 'Acesso ao menu de usuários (admin)'),

-- Botões de Ação - Módulos
('button_create_module', 'Criar Módulo', 'button', 'modules', 'Botão para criar novos módulos'),
('button_edit_module', 'Editar Módulo', 'button', 'modules', 'Botão para editar módulos'),
('button_delete_module', 'Deletar Módulo', 'button', 'modules', 'Botão para deletar módulos'),

-- Botões de Ação - Clientes
('button_create_client', 'Criar Cliente', 'button', 'clients', 'Botão para criar novos clientes'),
('button_edit_client', 'Editar Cliente', 'button', 'clients', 'Botão para editar clientes'),
('button_delete_client', 'Deletar Cliente', 'button', 'clients', 'Botão para deletar clientes'),

-- Botões de Ação - Versões
('button_create_version', 'Criar Versão', 'button', 'versions', 'Botão para criar novas versões'),
('button_edit_version', 'Editar Versão', 'button', 'versions', 'Botão para editar versões'),
('button_delete_version', 'Deletar Versão', 'button', 'versions', 'Botão para deletar versões'),

-- Seções do Dashboard
('section_dashboard_metrics', 'Métricas Dashboard', 'section', 'dashboard', 'Seção de métricas principais'),
('section_dashboard_charts', 'Gráficos Dashboard', 'section', 'dashboard', 'Seção de gráficos e relatórios'),

-- Funcionalidades Especiais
('feature_export_data', 'Exportar Dados', 'feature', 'reports', 'Funcionalidade de exportação de dados'),
('feature_bulk_actions', 'Ações em Lote', 'feature', 'all', 'Funcionalidade de ações em lote'),
('feature_advanced_filters', 'Filtros Avançados', 'feature', 'all', 'Acesso a filtros avançados')
ON CONFLICT (element_key) DO NOTHING;

-- 4. Função para verificar permissão de UI
CREATE OR REPLACE FUNCTION public.has_ui_permission(
    user_id_param UUID,
    element_key_param TEXT,
    permission_type TEXT DEFAULT 'visible' -- 'visible' ou 'enabled'
) RETURNS BOOLEAN AS $$
DECLARE
    user_role_val user_role;
    ui_permission_exists BOOLEAN := FALSE;
    is_visible_val BOOLEAN := TRUE;
    is_enabled_val BOOLEAN := TRUE;
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
    
    -- Verificar se existe permissão específica para este elemento
    SELECT 
        EXISTS(
            SELECT 1 FROM public.user_ui_permissions uup
            JOIN public.ui_elements ue ON ue.id = uup.ui_element_id
            WHERE uup.user_id = user_id_param 
            AND ue.element_key = element_key_param
        ),
        COALESCE(uup.is_visible, TRUE),
        COALESCE(uup.is_enabled, TRUE)
    INTO ui_permission_exists, is_visible_val, is_enabled_val
    FROM public.user_ui_permissions uup
    JOIN public.ui_elements ue ON ue.id = uup.ui_element_id
    WHERE uup.user_id = user_id_param 
    AND ue.element_key = element_key_param;
    
    -- Se tem permissão específica, usar ela
    IF ui_permission_exists THEN
        RETURN CASE 
            WHEN permission_type = 'visible' THEN is_visible_val
            WHEN permission_type = 'enabled' THEN is_enabled_val AND is_visible_val
            ELSE FALSE
        END;
    END IF;
    
    -- Permissões padrão por role (se não tem permissão específica)
    RETURN CASE 
        WHEN user_role_val = 'admin' THEN TRUE
        WHEN user_role_val = 'manager' THEN 
            CASE 
                WHEN element_key_param LIKE '%delete%' THEN FALSE
                WHEN element_key_param = 'sidebar_users' THEN FALSE
                ELSE TRUE
            END
        WHEN user_role_val = 'editor' THEN 
            CASE 
                WHEN element_key_param LIKE '%delete%' THEN FALSE
                WHEN element_key_param = 'sidebar_users' THEN FALSE
                WHEN element_key_param = 'sidebar_audit' THEN FALSE
                ELSE TRUE
            END
        WHEN user_role_val = 'viewer' THEN 
            CASE 
                WHEN element_key_param LIKE '%create%' THEN FALSE
                WHEN element_key_param LIKE '%edit%' THEN FALSE
                WHEN element_key_param LIKE '%delete%' THEN FALSE
                WHEN element_key_param = 'sidebar_users' THEN FALSE
                WHEN element_key_param = 'feature_export_data' THEN FALSE
                ELSE TRUE
            END
        ELSE FALSE
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Função para obter todas as permissões de UI de um usuário
CREATE OR REPLACE FUNCTION public.get_user_ui_permissions(user_id_param UUID)
RETURNS TABLE(
    element_key TEXT,
    element_name TEXT,
    element_type TEXT,
    parent_resource TEXT,
    is_visible BOOLEAN,
    is_enabled BOOLEAN,
    has_custom_permission BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ue.element_key,
        ue.element_name,
        ue.element_type,
        ue.parent_resource,
        COALESCE(uup.is_visible, public.has_ui_permission(user_id_param, ue.element_key, 'visible')) as is_visible,
        COALESCE(uup.is_enabled, public.has_ui_permission(user_id_param, ue.element_key, 'enabled')) as is_enabled,
        (uup.id IS NOT NULL) as has_custom_permission
    FROM public.ui_elements ue
    LEFT JOIN public.user_ui_permissions uup ON ue.id = uup.ui_element_id AND uup.user_id = user_id_param
    WHERE ue.is_active = TRUE
    ORDER BY ue.element_type, ue.parent_resource, ue.element_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Habilitar RLS para novas tabelas
ALTER TABLE public.ui_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ui_permissions ENABLE ROW LEVEL SECURITY;

-- 7. Policies para ui_elements (todos podem ver, só admins podem editar)
CREATE POLICY "Anyone can view ui elements" ON public.ui_elements
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage ui elements" ON public.ui_elements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

-- 8. Policies para user_ui_permissions
CREATE POLICY "Users can view their own ui permissions" ON public.user_ui_permissions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all ui permissions" ON public.user_ui_permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can manage ui permissions" ON public.user_ui_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

-- 9. Trigger para updated_at em user_ui_permissions
CREATE TRIGGER update_user_ui_permissions_updated_at
    BEFORE UPDATE ON public.user_ui_permissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Índices para performance
CREATE INDEX IF NOT EXISTS idx_ui_elements_key ON public.ui_elements(element_key);
CREATE INDEX IF NOT EXISTS idx_ui_elements_type ON public.ui_elements(element_type);
CREATE INDEX IF NOT EXISTS idx_user_ui_permissions_user ON public.user_ui_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ui_permissions_element ON public.user_ui_permissions(ui_element_id);

-- 11. Comentários para documentação
COMMENT ON TABLE public.ui_elements IS 'Elementos de UI controláveis (menus, botões, seções)';
COMMENT ON TABLE public.user_ui_permissions IS 'Permissões específicas de UI por usuário';
COMMENT ON FUNCTION public.has_ui_permission IS 'Verifica se usuário tem permissão específica para elemento de UI';
COMMENT ON FUNCTION public.get_user_ui_permissions IS 'Retorna todas as permissões de UI de um usuário';