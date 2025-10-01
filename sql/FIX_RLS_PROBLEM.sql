-- =====================================================
-- SOLUÇÃO PARA PROBLEMA DE RLS - user_profiles
-- =====================================================
-- Execute este SQL no painel do Supabase > SQL Editor

-- 1. Primeiro, verificar usuários criados
SELECT 
    id, 
    email, 
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email LIKE '%sistema.com.br%'
ORDER BY created_at DESC;

-- 2. Temporariamente desabilitar RLS para user_profiles
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. Criar perfil para o usuário criado
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

-- 4. Verificar se perfil foi criado
SELECT * FROM user_profiles WHERE email = 'administrador@sistema.com.br';

-- 5. Reabilitar RLS com política mais permissiva
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Dropar políticas antigas que podem estar causando problema
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON user_profiles;

-- 7. Criar políticas mais permissivas (temporárias para teste)
CREATE POLICY "Allow all for authenticated users" ON user_profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- INSTRUÇÕES:
-- =====================================================
-- 1. Execute este SQL completo no painel do Supabase
-- 2. Verifique se não há erros
-- 3. Teste login em: http://localhost:3001/auth/login
-- 4. Use: administrador@sistema.com.br / 123456
-- =====================================================

-- Verificação final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ SCRIPT EXECUTADO!';
    RAISE NOTICE '📧 Email: administrador@sistema.com.br';
    RAISE NOTICE '🔑 Senha: 123456';
    RAISE NOTICE '🌐 Teste: http://localhost:3001/auth/login';
    RAISE NOTICE '';
END $$;