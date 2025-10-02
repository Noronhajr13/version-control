-- =====================================================
-- SCRIPT COMPLETO DE SETUP DA BASE DE DADOS
-- Version Control App - Supabase Database Setup
-- =====================================================
-- 
-- Este script pode ser executado diretamente no painel do Supabase
-- SQL Editor para criar toda a estrutura necessária
--
-- INSTRUÇÕES:
-- 1. Faça login no seu projeto Supabase
-- 2. Vá para SQL Editor
-- 3. Cole este script completo
-- 4. Execute (vai demorar alguns segundos)
-- 5. Verifique se não há erros
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'manager', 'editor', 'viewer')),
    department TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    last_login_at TIMESTAMPTZ
);

-- Índices para user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(is_active);

-- Tabela de módulos
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Índices para modules
CREATE INDEX IF NOT EXISTS idx_modules_name ON modules(name);
CREATE INDEX IF NOT EXISTS idx_modules_created_at ON modules(created_at);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    uf TEXT NOT NULL CHECK (length(uf) = 2),
    address TEXT,
    city TEXT,
    zip_code TEXT,
    contact_person TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Índices para clients
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_uf ON clients(uf);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(is_active);

-- Tabela de versões
CREATE TABLE IF NOT EXISTS versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    jira_card TEXT,
    themes_folder TEXT,
    version_number TEXT NOT NULL,
    release_date DATE,
    scripts TEXT,
    powerbuilder_version TEXT,
    file_path TEXT,
    status TEXT DEFAULT 'interna' CHECK (status IN ('interna', 'teste', 'homologacao', 'producao', 'deprecated')),
    description TEXT,
    data_generation TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(module_id, version_number)
);

-- Índices para versions
CREATE INDEX IF NOT EXISTS idx_versions_module_id ON versions(module_id);
CREATE INDEX IF NOT EXISTS idx_versions_status ON versions(status);
CREATE INDEX IF NOT EXISTS idx_versions_release_date ON versions(release_date);
CREATE INDEX IF NOT EXISTS idx_versions_created_at ON versions(created_at);

-- Tabela de relacionamento versões-clientes
CREATE TABLE IF NOT EXISTS version_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    installed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    UNIQUE(version_id, client_id)
);

-- Índices para version_clients
CREATE INDEX IF NOT EXISTS idx_version_clients_version_id ON version_clients(version_id);
CREATE INDEX IF NOT EXISTS idx_version_clients_client_id ON version_clients(client_id);

-- Tabela de cards/tarefas
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
    jira_number TEXT NOT NULL,
    last_update DATE NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para cards
CREATE INDEX IF NOT EXISTS idx_cards_version_id ON cards(version_id);
CREATE INDEX IF NOT EXISTS idx_cards_jira_number ON cards(jira_number);

-- =====================================================
-- 2. FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar perfil automaticamente quando usuário é criado
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, display_name, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        'viewer'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers para updated_at
DROP TRIGGER IF EXISTS trigger_updated_at_user_profiles ON user_profiles;
CREATE TRIGGER trigger_updated_at_user_profiles
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_updated_at_modules ON modules;
CREATE TRIGGER trigger_updated_at_modules
    BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_updated_at_clients ON clients;
CREATE TRIGGER trigger_updated_at_clients
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_updated_at_versions ON versions;
CREATE TRIGGER trigger_updated_at_versions
    BEFORE UPDATE ON versions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_updated_at_cards ON cards;
CREATE TRIGGER trigger_updated_at_cards
    BEFORE UPDATE ON cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 3. POLÍTICAS DE SEGURANÇA (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
CREATE POLICY "Enable read access for authenticated users" ON user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
CREATE POLICY "Enable insert for authenticated users" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Enable update for users based on id" ON user_profiles;
CREATE POLICY "Enable update for users based on id" ON user_profiles
    FOR UPDATE USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));

-- Políticas básicas para outras tabelas (podem ser refinadas depois)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON modules;
CREATE POLICY "Enable all for authenticated users" ON modules
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all for authenticated users" ON clients;
CREATE POLICY "Enable all for authenticated users" ON clients
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all for authenticated users" ON versions;
CREATE POLICY "Enable all for authenticated users" ON versions
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all for authenticated users" ON version_clients;
CREATE POLICY "Enable all for authenticated users" ON version_clients
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all for authenticated users" ON cards;
CREATE POLICY "Enable all for authenticated users" ON cards
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 4. FUNÇÕES UTILITÁRIAS
-- =====================================================

-- Função para obter estatísticas do sistema
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM user_profiles),
        'total_modules', (SELECT COUNT(*) FROM modules),
        'total_clients', (SELECT COUNT(*) FROM clients),
        'total_versions', (SELECT COUNT(*) FROM versions),
        'active_users', (SELECT COUNT(*) FROM user_profiles WHERE is_active = true),
        'recent_versions', (SELECT COUNT(*) FROM versions WHERE created_at > NOW() - INTERVAL '30 days')
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar permissões de usuário
CREATE OR REPLACE FUNCTION check_user_permission(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    role_hierarchy INTEGER;
    required_hierarchy INTEGER;
BEGIN
    -- Buscar role do usuário
    SELECT role INTO user_role FROM user_profiles WHERE id = user_id AND is_active = true;
    
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Definir hierarquia de roles (maior número = mais permissões)
    role_hierarchy := CASE user_role
        WHEN 'super_admin' THEN 5
        WHEN 'admin' THEN 4
        WHEN 'manager' THEN 3
        WHEN 'editor' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
    END;
    
    required_hierarchy := CASE required_role
        WHEN 'super_admin' THEN 5
        WHEN 'admin' THEN 4
        WHEN 'manager' THEN 3
        WHEN 'editor' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
    END;
    
    RETURN role_hierarchy >= required_hierarchy;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. DADOS INICIAIS (OPCIONAL)
-- =====================================================

-- Inserir alguns módulos de exemplo (opcional, pode comentar se não quiser)
INSERT INTO modules (name, description) VALUES 
    ('Sistema Principal', 'Módulo principal do sistema'),
    ('Relatórios', 'Módulo de relatórios e analytics'),
    ('Integração', 'Módulo de integrações externas')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 6. VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
    tables_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO tables_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('user_profiles', 'modules', 'clients', 'versions', 'version_clients', 'cards');
    
    IF tables_count = 6 THEN
        RAISE NOTICE '✅ Todas as 6 tabelas foram criadas com sucesso!';
    ELSE
        RAISE NOTICE '⚠️ Apenas % de 6 tabelas foram criadas. Verifique os erros acima.', tables_count;
    END IF;
END $$;

-- Verificar se as funções foram criadas
DO $$
DECLARE
    functions_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO functions_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('update_updated_at_column', 'handle_new_user', 'get_system_stats', 'check_user_permission');
    
    IF functions_count >= 4 THEN
        RAISE NOTICE '✅ Funções principais criadas com sucesso!';
    ELSE
        RAISE NOTICE '⚠️ Apenas % funções foram criadas. Verifique os erros acima.', functions_count;
    END IF;
END $$;

-- =====================================================
-- 7. MENSAGEM FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '🎉 SETUP DA BASE DE DADOS CONCLUÍDO!';
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Próximos passos:';
    RAISE NOTICE '1. Criar usuário admin via Auth do Supabase';
    RAISE NOTICE '2. Ou usar a página /database-setup no seu app';
    RAISE NOTICE '3. Fazer login e testar o sistema';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Estrutura criada:';
    RAISE NOTICE '   - 6 tabelas principais';
    RAISE NOTICE '   - Triggers automáticos';
    RAISE NOTICE '   - Políticas de segurança (RLS)';
    RAISE NOTICE '   - Funções utilitárias';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Sistema pronto para uso!';
END $$;