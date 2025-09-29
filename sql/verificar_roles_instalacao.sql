-- ========================================
-- VERIFICAÇÃO PÓS-INSTALAÇÃO DO SISTEMA DE ROLES
-- ========================================

-- 1. Verificar se as tabelas foram criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'user_permissions')
ORDER BY table_name;

-- 2. Verificar se o tipo user_role foi criado
SELECT 
    typname as "Tipo Enum",
    array_agg(enumlabel order by enumsortorder) as "Valores Possíveis"
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'user_role'
GROUP BY typname;

-- 3. Verificar estrutura da tabela user_profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 4. Verificar se as funções foram criadas
SELECT 
    routine_name as "Função",
    routine_type as "Tipo"
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('has_permission', 'get_user_with_permissions', 'handle_new_user')
ORDER BY routine_name;

-- 5. Verificar triggers
SELECT 
    trigger_name as "Trigger",
    event_object_table as "Tabela",
    action_timing as "Timing",
    event_manipulation as "Evento"
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name IN ('on_auth_user_created', 'update_user_profiles_updated_at');

-- 6. Verificar policies RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as "Comando"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'user_permissions');

-- 7. Verificar índices criados
SELECT 
    indexname as "Índice",
    tablename as "Tabela"
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'user_permissions')
AND indexname LIKE 'idx_%';

-- 8. Se você já fez login, verificar se seu profile foi criado
SELECT 
    id,
    email,
    display_name,
    role,
    is_active,
    created_at
FROM public.user_profiles
WHERE email = 'noronhajr_13@hotmail.com';