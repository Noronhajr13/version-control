-- ========================================
-- CORREÇÃO DO ERRO DE RECURSÃO INFINITA
-- ========================================
-- Execute no Supabase SQL Editor:

-- 1. REMOVER todas as policies problemáticas
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.user_permissions;

-- 2. DESABILITAR RLS temporariamente para corrigir
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions DISABLE ROW LEVEL SECURITY;

-- 3. Criar profile para o usuário SEM policies ativas
INSERT INTO public.user_profiles (
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
    'super_admin'::user_role,
    true,
    now(),
    now()
FROM auth.users 
WHERE email = 'noronhajf22@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin'::user_role,
    is_active = true,
    updated_at = now();

-- 4. Verificar se foi criado
SELECT 
    'Profile criado com sucesso!' as status,
    id,
    email,
    display_name,
    role,
    is_active
FROM public.user_profiles 
WHERE email = 'noronhajf22@gmail.com';

-- 5. RECRIAR policies SEM recursão
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Policy simples para user_profiles (SEM recursão)
CREATE POLICY "Allow users to view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy para permitir que service_role acesse tudo (para funções)
CREATE POLICY "Allow service role full access" ON public.user_profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Policy para admins (usando uma abordagem diferente)
CREATE POLICY "Allow authenticated users to read profiles" ON public.user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policies simples para user_permissions
CREATE POLICY "Allow users to view their own permissions" ON public.user_permissions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Allow service role full access to permissions" ON public.user_permissions
    FOR ALL USING (auth.role() = 'service_role');

-- 6. Atualizar função get_user_with_permissions para usar SECURITY DEFINER adequadamente
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
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 7. Testar a função
SELECT 'Testando função:' as teste, * 
FROM public.get_user_with_permissions(
    (SELECT id FROM auth.users WHERE email = 'noronhajf22@gmail.com')
);