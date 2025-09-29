-- VERIFICAÇÃO RÁPIDA
SELECT 'Verificando tabelas...' as status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'user_permissions');

SELECT 'Se não aparecer nenhuma tabela acima, execute o SQL principal!' as instrucao;
