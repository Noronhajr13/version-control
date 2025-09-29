-- ========================================
-- LIMPEZA E RECRIAÇÃO DO SISTEMA DE ROLES
-- ========================================
-- Execute ESTE SQL primeiro para limpar tudo

-- 1. Remover policies existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.user_permissions;

-- 2. Remover triggers existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;

-- 3. Remover funções existentes
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.has_permission(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_with_permissions(UUID) CASCADE;

-- 4. Remover tabelas (cuidado - isso remove todos os dados!)
DROP TABLE IF EXISTS public.user_permissions CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 5. Remover tipo enum
DROP TYPE IF EXISTS user_role CASCADE;

-- AGORA EXECUTE O SQL PRINCIPAL (06_user_roles_system.sql) NOVAMENTE