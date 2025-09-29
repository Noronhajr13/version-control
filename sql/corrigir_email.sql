-- ========================================
-- CORREÇÃO IMEDIATA - CRIAR PROFILE MANUAL
-- ========================================
-- Execute no Supabase SQL Editor:

-- 1. Primeiro, verificar se o usuário existe no auth.users
SELECT 
    id, 
    email, 
    created_at,
    'Usuário encontrado no sistema auth' as status
FROM auth.users 
WHERE email = 'noronhajf22@gmail.com';

-- 2. Criar profile manualmente para o seu email
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

-- 3. Verificar se foi criado
SELECT 
    id,
    email,
    display_name,
    role,
    is_active,
    'Profile criado com sucesso!' as status
FROM public.user_profiles 
WHERE email = 'noronhajf22@gmail.com';

-- 4. Atualizar a função para reconhecer seu email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        CASE 
            WHEN NEW.email IN ('noronhajr_13@hotmail.com', 'noronhajf22@gmail.com') THEN 'super_admin'::user_role
            ELSE 'viewer'::user_role
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;