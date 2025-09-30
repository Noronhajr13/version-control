-- =====================================================
-- MIGRAÇÃO SIMPLIFICADA - EXECUTAR NO SUPABASE SQL EDITOR
-- =====================================================

-- PASSO 1: Verificar situação atual
SELECT 'VERIFICAÇÃO INICIAL - Usuários atuais:' as info;
SELECT email, role::text as current_role, is_active FROM user_profiles ORDER BY email;

-- PASSO 2: Backup das roles atuais (para referência)
SELECT 'BACKUP - Contagem por role atual:' as info;
SELECT role::text, COUNT(*) as quantidade FROM user_profiles GROUP BY role;

-- PASSO 3: Atualizar roles diretamente (se as colunas existem)
-- Mapear roles antigas para novas
UPDATE user_profiles 
SET role = CASE 
    WHEN role::text = 'super_admin' THEN 'admin'
    WHEN role::text = 'editor' THEN 'manager'
    ELSE role::text
END::user_role
WHERE role::text IN ('super_admin', 'editor');

-- PASSO 4: Garantir que o usuário principal é admin
UPDATE user_profiles 
SET role = 'admin'::user_role
WHERE email = 'noronhajr_13@hotmail.com';

-- PASSO 5: Definir role padrão para novos usuários
ALTER TABLE user_profiles ALTER COLUMN role SET DEFAULT 'viewer'::user_role;

-- PASSO 6: Verificar resultado
SELECT 'RESULTADO FINAL - Usuários após migração:' as info;
SELECT 
    email,
    role::text as new_role,
    is_active,
    display_name
FROM user_profiles 
ORDER BY 
    CASE role::text
        WHEN 'admin' THEN 1
        WHEN 'manager' THEN 2  
        WHEN 'viewer' THEN 3
    END,
    email;

-- PASSO 7: Estatísticas finais
SELECT 'ESTATÍSTICAS FINAIS:' as info;
SELECT 
    role::text,
    COUNT(*) as quantidade,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_profiles)), 2) as percentual
FROM user_profiles 
GROUP BY role
ORDER BY quantidade DESC;

-- PASSO 8: Verificar se temos pelo menos um admin
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Sistema tem administradores'
        ELSE '⚠️ ATENÇÃO: Nenhum admin encontrado!'
    END as status_admin
FROM user_profiles 
WHERE role = 'admin' AND is_active = true;

SELECT '🎉 MIGRAÇÃO BÁSICA CONCLUÍDA!' as resultado;