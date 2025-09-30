-- Script para mapear a estrutura real do Supabase
-- Execute este script no SQL Editor do Supabase para ver a estrutura atual

-- 1. TABELAS EXISTENTES
SELECT 'TABELAS NO SCHEMA PUBLIC:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. ESTRUTURA DA TABELA CLIENTS
SELECT 'ESTRUTURA DA TABELA CLIENTS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'clients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. ESTRUTURA DA TABELA VERSIONS
SELECT 'ESTRUTURA DA TABELA VERSIONS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'versions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. ESTRUTURA DA TABELA VERSION_CLIENTS
SELECT 'ESTRUTURA DA TABELA VERSION_CLIENTS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'version_clients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. ESTRUTURA DA TABELA MODULES
SELECT 'ESTRUTURA DA TABELA MODULES:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'modules' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. FOREIGN KEYS E RELATIONSHIPS
SELECT 'FOREIGN KEYS:' as info;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 7. SAMPLE DATA
SELECT 'SAMPLE DATA - VERSION_CLIENTS:' as info;
SELECT * FROM version_clients LIMIT 3;

SELECT 'SAMPLE DATA - CLIENTS:' as info;
SELECT id, name, uf, created_at FROM clients LIMIT 3;

SELECT 'SAMPLE DATA - VERSIONS:' as info;
SELECT id, version_number, tag, module_id, created_at FROM versions LIMIT 3;