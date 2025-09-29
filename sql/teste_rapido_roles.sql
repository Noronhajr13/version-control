-- Query simples para validar o sistema de roles
-- Execute no SQL Editor do Supabase:

-- 1. Verificar se as tabelas existem
SELECT 'Tabelas criadas com sucesso!' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
)
AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_permissions'
);

-- 2. Verificar seu profile (rode depois de fazer login)
SELECT 
    'Profile encontrado!' as status,
    email,
    role,
    is_active,
    created_at
FROM public.user_profiles
WHERE email = 'noronhajr_13@hotmail.com';

-- 3. Testar função has_permission
SELECT 
    'Função funcionando!' as status,
    public.has_permission(
        (SELECT id FROM public.user_profiles WHERE email = 'noronhajr_13@hotmail.com'),
        'modules',
        'delete'
    ) as "Tem permissão para deletar módulos";