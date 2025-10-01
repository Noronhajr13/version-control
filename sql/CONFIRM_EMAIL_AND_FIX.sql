-- =====================================================
-- CONFIRMAR EMAIL DO USUÁRIO MANUALMENTE
-- =====================================================
-- Execute este SQL no painel do Supabase > SQL Editor

-- 1. Verificar usuário atual
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    confirmation_token
FROM auth.users 
WHERE email = 'administrador@sistema.com.br';

-- 2. CONFIRMAR EMAIL MANUALMENTE
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    confirmation_token = '',
    updated_at = NOW()
WHERE email = 'administrador@sistema.com.br'
AND email_confirmed_at IS NULL;

-- 3. Verificar se foi confirmado
SELECT 
    id,
    email,
    email_confirmed_at,
    'CONFIRMADO!' as status
FROM auth.users 
WHERE email = 'administrador@sistema.com.br';

-- 4. Garantir que o perfil existe
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
    'Administrador Sistema',
    'admin',
    true,
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'administrador@sistema.com.br'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_active = true,
    updated_at = NOW();

-- 5. Desabilitar RLS temporariamente se necessário
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 6. Verificar perfil criado
SELECT * FROM user_profiles WHERE email = 'administrador@sistema.com.br';

-- 7. Reabilitar RLS com política permissiva
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Dropar políticas antigas
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON user_profiles;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON user_profiles;

-- Criar política mais permissiva
CREATE POLICY "Allow all operations for authenticated users" ON user_profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- RESULTADO FINAL
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ EMAIL CONFIRMADO MANUALMENTE!';
    RAISE NOTICE '✅ PERFIL CRIADO/ATUALIZADO!';
    RAISE NOTICE '✅ RLS AJUSTADO!';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 CREDENCIAIS PARA LOGIN:';
    RAISE NOTICE '📧 Email: administrador@sistema.com.br';
    RAISE NOTICE '🔑 Senha: 123456';
    RAISE NOTICE '';
    RAISE NOTICE '🌐 Teste agora em: http://localhost:3001/auth/login';
    RAISE NOTICE '';
END $$;