#!/bin/bash

# Script para verificar o banco de dados do Supabase
echo "🔍 VERIFICANDO SISTEMA DE ROLES NO SUPABASE"
echo "==========================================="

# URL e projeto do Supabase
SUPABASE_URL="https://gikcypxyhghsqduidjtb.supabase.co"
PROJECT_REF="gikcypxyhghsqduidjtb"

echo "📍 Projeto: $PROJECT_REF"
echo ""

# Verificar se as tabelas existem
echo "1️⃣ Verificando se as tabelas foram criadas..."
./supabase db inspect --db-url="postgresql://postgres:[PASSWORD]@db.$PROJECT_REF.supabase.co:5432/postgres" --schema=public 2>/dev/null | grep -E "(user_profiles|user_permissions)" || echo "❌ Tabelas não encontradas"

echo ""
echo "2️⃣ Para verificar manualmente, execute no SQL Editor do Supabase:"
echo ""
cat << 'EOF'
-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'user_permissions');

-- Verificar enum
SELECT typname, array_agg(enumlabel) as valores
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'user_role'
GROUP BY typname;

-- Verificar funções
SELECT routine_name 
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('has_permission', 'get_user_with_permissions');

-- Verificar se há usuários logados
SELECT count(*) as "Usuários no auth.users" FROM auth.users;

-- Verificar profiles criados  
SELECT 
    email,
    role,
    is_active,
    created_at
FROM public.user_profiles;
EOF

echo ""
echo "3️⃣ Se as tabelas não existirem, execute novamente:"
echo "sql/06_user_roles_system.sql"