-- =====================================================
-- VERIFICAÇÃO E CRIAÇÃO DE ESTRUTURAS BÁSICAS
-- =====================================================

-- PASSO 1: Verificar se as tabelas principais existem
SELECT 'VERIFICANDO TABELAS EXISTENTES:' as info;
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Não existe'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'versions', 'clients', 'modules')
ORDER BY table_name;

-- PASSO 2: Verificar se o enum user_role existe
SELECT 'VERIFICANDO ENUM USER_ROLE:' as info;
SELECT 
    typname as enum_name,
    array_agg(enumlabel ORDER BY enumsortorder) as valores
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname = 'user_role'
GROUP BY typname;

-- PASSO 3: Criar tabela user_profiles se não existir
CREATE TABLE IF NOT EXISTS user_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    display_name text,
    role text DEFAULT 'viewer',
    department text,
    avatar_url text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- PASSO 4: Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(is_active);

-- PASSO 5: Criar usuário admin inicial se não existir
INSERT INTO user_profiles (
    email,
    display_name,
    role,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    'noronhajr_13@hotmail.com',
    'Admin Principal',
    'admin',
    true,
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE email = 'noronhajr_13@hotmail.com'
);

-- PASSO 6: Verificar resultado
SELECT 'USUÁRIOS CRIADOS:' as info;
SELECT email, role, is_active, created_at FROM user_profiles ORDER BY created_at;

-- PASSO 7: Habilitar RLS básico
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política básica: usuários podem ver próprio perfil
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid()::text = id::text);

-- Política básica: admins podem ver tudo
CREATE POLICY IF NOT EXISTS "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id::text = auth.uid()::text 
            AND up.role = 'admin' 
            AND up.is_active = true
        )
    );

SELECT '✅ ESTRUTURA BÁSICA CRIADA!' as resultado;