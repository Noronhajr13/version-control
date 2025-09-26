-- Verificar se as colunas já existem antes de adicionar
DO $$ 
BEGIN
    -- Verificar se o tipo enum já existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'version_status') THEN
        CREATE TYPE version_status AS ENUM (
            'interna',
            'teste', 
            'homologacao',
            'producao',
            'deprecated'
        );
    END IF;

    -- Adicionar coluna status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='versions' AND column_name='status') THEN
        ALTER TABLE versions ADD COLUMN status version_status DEFAULT 'interna';
    END IF;

    -- Adicionar coluna data_generation se não existir  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='versions' AND column_name='data_generation') THEN
        ALTER TABLE versions ADD COLUMN data_generation DATE;
    END IF;

    -- Criar tabela version_clients se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='version_clients') THEN
        CREATE TABLE version_clients (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
            client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            UNIQUE(version_id, client_id)
        );

        -- Criar índices
        CREATE INDEX IF NOT EXISTS idx_version_clients_version_id ON version_clients(version_id);
        CREATE INDEX IF NOT EXISTS idx_version_clients_client_id ON version_clients(client_id);
    END IF;

    -- Criar índices se não existirem
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_versions_status') THEN
        CREATE INDEX idx_versions_status ON versions(status);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_versions_data_generation') THEN
        CREATE INDEX idx_versions_data_generation ON versions(data_generation);
    END IF;

END $$;