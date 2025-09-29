-- ========================================
-- TESTE COMPLETO DO BANCO DE DADOS
-- ========================================
-- Execute no Supabase SQL Editor para diagnosticar:

-- 1. Verificar se as tabelas foram realmente criadas
SELECT 
    'TESTE 1: Verificando tabelas' as teste,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'user_permissions')
ORDER BY table_name;

-- 2. Verificar se o enum foi criado
SELECT 
    'TESTE 2: Verificando enum user_role' as teste,
    typname as "Tipo Enum",
    array_agg(enumlabel order by enumsortorder) as "Valores Possíveis"
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'user_role'
GROUP BY typname;

-- 3. Verificar estrutura da tabela user_profiles
SELECT 
    'TESTE 3: Estrutura user_profiles' as teste,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 4. Verificar usuários existentes no auth.users
SELECT 
    'TESTE 4: Usuários no auth.users' as teste,
    id,
    email,
    created_at,
    email_confirmed_at IS NOT NULL as email_confirmado
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar profiles existentes
SELECT 
    'TESTE 5: Profiles na user_profiles' as teste,
    id,
    email,
    role,
    is_active,
    created_at
FROM public.user_profiles;

-- 6. Tentar criar profile manualmente (versão mais simples)
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Buscar o UUID do usuário
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = 'noronhajf22@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Tentar inserir o profile
        INSERT INTO public.user_profiles (
            id, 
            email, 
            display_name, 
            role, 
            is_active
        ) VALUES (
            user_uuid,
            'noronhajf22@gmail.com',
            'Super Admin',
            'super_admin'::user_role,
            true
        ) ON CONFLICT (id) DO UPDATE SET
            role = 'super_admin'::user_role,
            is_active = true,
            updated_at = now();
            
        RAISE NOTICE 'Profile criado/atualizado para usuário %', user_uuid;
    ELSE
        RAISE NOTICE 'Usuário noronhajf22@gmail.com não encontrado no auth.users';
    END IF;
END $$;

-- 7. Verificar novamente se o profile foi criado
SELECT 
    'TESTE 7: Profile após criação manual' as teste,
    id,
    email,
    role,
    is_active,
    created_at
FROM public.user_profiles
WHERE email = 'noronhajf22@gmail.com';