# Script para aplicar migrações do banco Supabase

## Comandos para executar no SQL Editor do Supabase:

### 1. Verificar se as colunas status e data_generation existem:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'versions' 
  AND column_name IN ('status', 'data_generation');
```

### 2. Se não existirem, criar o tipo enum e adicionar as colunas:
```sql
-- Criar tipo enum se não existir
DO $$ BEGIN
    CREATE TYPE version_status AS ENUM ('interna', 'teste', 'homologacao', 'producao', 'deprecated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar colunas
ALTER TABLE versions 
ADD COLUMN IF NOT EXISTS status version_status DEFAULT 'interna',
ADD COLUMN IF NOT EXISTS data_generation DATE;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_versions_status ON versions(status);
CREATE INDEX IF NOT EXISTS idx_versions_data_generation ON versions(data_generation);
```

### 3. Criar tabela version_clients se não existir:
```sql
CREATE TABLE IF NOT EXISTS version_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(version_id, client_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_version_clients_version_id ON version_clients(version_id);
CREATE INDEX IF NOT EXISTS idx_version_clients_client_id ON version_clients(client_id);
```

### 4. Habilitar RLS (Row Level Security) se necessário:
```sql
ALTER TABLE version_clients ENABLE ROW LEVEL SECURITY;

-- Política básica de acesso (ajustar conforme necessário)
CREATE POLICY "Enable all access for authenticated users" ON version_clients
FOR ALL USING (auth.role() = 'authenticated');
```

## Como aplicar:
1. Acesse o painel do Supabase
2. Vá para SQL Editor
3. Execute os comandos acima um por vez
4. Verifique se não há erros

## Debug:
Se o erro "No API key found" persistir, verifique:
- Se as variáveis de ambiente estão corretas no .env.local
- Se o projeto está conectado ao Supabase correto
- Se as políticas RLS estão configuradas corretamente