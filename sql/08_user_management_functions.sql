-- ========================================
-- FUNÇÃO PARA BUSCAR USUÁRIOS NÃO REGISTRADOS
-- ========================================
-- Criado em: 2025-09-29
-- Descrição: Função para encontrar usuários do auth.users que não têm perfil em user_profiles

-- Função para buscar usuários autenticados que não estão em user_profiles
CREATE OR REPLACE FUNCTION public.search_unregistered_users(search_term TEXT)
RETURNS TABLE(
    id UUID,
    email TEXT,
    user_metadata JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        au.raw_user_meta_data as user_metadata,
        au.created_at
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id
    WHERE up.id IS NULL  -- Usuários que não têm perfil
    AND au.email_confirmed_at IS NOT NULL  -- Apenas usuários com email confirmado
    AND (
        au.email ILIKE '%' || search_term || '%' 
        OR au.raw_user_meta_data->>'name' ILIKE '%' || search_term || '%'
        OR au.raw_user_meta_data->>'full_name' ILIKE '%' || search_term || '%'
    )
    ORDER BY au.created_at DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de usuários
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS TABLE(
    total_auth_users BIGINT,
    total_profiles BIGINT,
    unregistered_users BIGINT,
    active_profiles BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as total_auth_users,
        (SELECT COUNT(*) FROM public.user_profiles) as total_profiles,
        (SELECT COUNT(*) FROM auth.users au 
         LEFT JOIN public.user_profiles up ON au.id = up.id 
         WHERE up.id IS NULL AND au.email_confirmed_at IS NOT NULL) as unregistered_users,
        (SELECT COUNT(*) FROM public.user_profiles WHERE is_active = TRUE) as active_profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policy para permitir que admins executem essas funções
-- (As funções já são SECURITY DEFINER, mas vamos garantir)

COMMENT ON FUNCTION public.search_unregistered_users IS 'Busca usuários autenticados que não possuem perfil em user_profiles';
COMMENT ON FUNCTION public.get_user_stats IS 'Retorna estatísticas de usuários do sistema';