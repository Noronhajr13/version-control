-- Script para criar usuário admin diretamente no Supabase
-- Execute este SQL no painel do Supabase -> SQL Editor

-- 1. Primeiro, vamos verificar se as tabelas existem
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'modules', 'clients', 'versions')
ORDER BY tablename;

-- 2. Verificar estrutura da tabela user_profiles
\d user_profiles;

-- 3. Inserir usuário admin diretamente (método alternativo)
-- IMPORTANTE: Execute apenas se não conseguir criar via auth.signUp

-- Primeiro, gerar um UUID para o usuário
SELECT gen_random_uuid() as user_id;

-- Depois usar o UUID gerado para inserir o perfil
-- SUBSTITUA 'SEU_UUID_AQUI' pelo UUID gerado acima
INSERT INTO user_profiles (
  id,
  email,
  display_name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'SEU_UUID_AQUI', -- UUID gerado acima
  'admin@test.com',
  'Administrador',
  'admin',
  true,
  NOW(),
  NOW()
);

-- 4. Verificar se foi inserido
SELECT * FROM user_profiles WHERE email = 'admin@test.com';

-- 5. Se você tiver acesso às tabelas de auth, também podemos tentar:
-- (Só execute se tiver permissões)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  created_at,
  updated_at,
  email_confirmed_at,
  confirmation_token,
  recovery_token
) VALUES (
  'SEU_UUID_AQUI', -- Mesmo UUID do perfil
  'admin@test.com',
  crypt('123456', gen_salt('bf')), -- Senha criptografada
  NOW(),
  NOW(),
  NOW(),
  '',
  ''
);