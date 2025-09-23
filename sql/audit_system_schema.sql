-- =====================================================
-- SISTEMA DE AUDITORIA - SCHEMA DATABASE
-- Data: 2025-09-23
-- Descrição: Tabela e triggers para auditoria completa
-- =====================================================

-- TABELA PRINCIPAL DE AUDITORIA
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Informações da operação
    table_name TEXT NOT NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id UUID NOT NULL,
    
    -- Dados da alteração
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Informações do usuário
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    user_agent TEXT,
    ip_address TEXT,
    
    -- Metadados
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT,
    request_id TEXT,
    
    -- Contexto adicional
    description TEXT,
    tags TEXT[]
);

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation_type ON audit_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- ÍNDICE COMPOSTO PARA CONSULTAS COMUNS
CREATE INDEX IF NOT EXISTS idx_audit_logs_common_query 
ON audit_logs(table_name, timestamp DESC, operation_type);

-- RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios logs (ou admins veem tudo)
CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'admin'
    );

-- Política: Apenas o sistema pode inserir logs
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- FUNÇÃO PARA CAPTURAR MUDANÇAS
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_record JSONB;
    new_record JSONB;
    changed_fields TEXT[] := ARRAY[]::TEXT[];
    field_name TEXT;
    user_info RECORD;
BEGIN
    -- Capturar informações do usuário atual
    SELECT 
        auth.uid() as user_id,
        auth.jwt() ->> 'email' as user_email
    INTO user_info;
    
    -- Processar baseado no tipo de operação
    IF TG_OP = 'DELETE' THEN
        old_record := to_jsonb(OLD);
        new_record := NULL;
        
        INSERT INTO audit_logs (
            table_name, operation_type, record_id,
            old_values, new_values, changed_fields,
            user_id, user_email, description
        ) VALUES (
            TG_TABLE_NAME, TG_OP, OLD.id,
            old_record, new_record, ARRAY['*'],
            user_info.user_id, user_info.user_email,
            format('Registro deletado da tabela %s', TG_TABLE_NAME)
        );
        
        RETURN OLD;
        
    ELSIF TG_OP = 'INSERT' THEN
        old_record := NULL;
        new_record := to_jsonb(NEW);
        
        INSERT INTO audit_logs (
            table_name, operation_type, record_id,
            old_values, new_values, changed_fields,
            user_id, user_email, description
        ) VALUES (
            TG_TABLE_NAME, TG_OP, NEW.id,
            old_record, new_record, ARRAY['*'],
            user_info.user_id, user_info.user_email,
            format('Novo registro criado na tabela %s', TG_TABLE_NAME)
        );
        
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        old_record := to_jsonb(OLD);
        new_record := to_jsonb(NEW);
        
        -- Identificar campos que mudaram
        FOR field_name IN SELECT jsonb_object_keys(new_record) LOOP
            IF old_record->>field_name IS DISTINCT FROM new_record->>field_name THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
        
        -- Só registrar se houve mudanças
        IF array_length(changed_fields, 1) > 0 THEN
            INSERT INTO audit_logs (
                table_name, operation_type, record_id,
                old_values, new_values, changed_fields,
                user_id, user_email, description
            ) VALUES (
                TG_TABLE_NAME, TG_OP, NEW.id,
                old_record, new_record, changed_fields,
                user_info.user_id, user_info.user_email,
                format('Registro atualizado na tabela %s (%s campos alterados)', 
                       TG_TABLE_NAME, array_length(changed_fields, 1))
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS PARA TABELAS PRINCIPAIS
DROP TRIGGER IF EXISTS audit_versions_trigger ON versions;
CREATE TRIGGER audit_versions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON versions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_modules_trigger ON modules;
CREATE TRIGGER audit_modules_trigger
    AFTER INSERT OR UPDATE OR DELETE ON modules
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_clients_trigger ON clients;
CREATE TRIGGER audit_clients_trigger
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- VIEWS PARA CONSULTAS OTIMIZADAS
CREATE OR REPLACE VIEW audit_logs_with_user_info AS
SELECT 
    al.*,
    u.email as user_display_email,
    u.created_at as user_created_at
FROM audit_logs al
LEFT JOIN auth.users u ON al.user_id = u.id;

-- VIEW PARA RESUMO POR TABELA
CREATE OR REPLACE VIEW audit_summary_by_table AS
SELECT 
    table_name,
    operation_type,
    COUNT(*) as operation_count,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(timestamp) as first_operation,
    MAX(timestamp) as last_operation
FROM audit_logs
GROUP BY table_name, operation_type
ORDER BY table_name, operation_type;

-- VIEW PARA ATIVIDADE RECENTE
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT 
    al.*,
    u.email as user_display_email
FROM audit_logs al
LEFT JOIN auth.users u ON al.user_id = u.id
WHERE al.timestamp >= NOW() - INTERVAL '7 days'
ORDER BY al.timestamp DESC
LIMIT 100;

-- COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE audit_logs IS 'Log completo de auditoria para todas as operações CRUD';
COMMENT ON COLUMN audit_logs.table_name IS 'Nome da tabela que foi modificada';
COMMENT ON COLUMN audit_logs.operation_type IS 'Tipo de operação: INSERT, UPDATE, DELETE';
COMMENT ON COLUMN audit_logs.record_id IS 'ID do registro que foi modificado';
COMMENT ON COLUMN audit_logs.old_values IS 'Valores antes da modificação (JSON)';
COMMENT ON COLUMN audit_logs.new_values IS 'Valores depois da modificação (JSON)';
COMMENT ON COLUMN audit_logs.changed_fields IS 'Array com nomes dos campos que mudaram';
COMMENT ON COLUMN audit_logs.user_id IS 'ID do usuário que fez a modificação';
COMMENT ON COLUMN audit_logs.timestamp IS 'Data/hora da operação';

-- FUNÇÃO PARA LIMPEZA AUTOMÁTICA (OPCIONAL)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Remove logs mais antigos que 1 ano (configurável)
    DELETE FROM audit_logs 
    WHERE timestamp < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- FUNÇÃO PARA ESTATÍSTICAS DE AUDITORIA
CREATE OR REPLACE FUNCTION get_audit_stats()
RETURNS TABLE(
    total_logs BIGINT,
    logs_last_7_days BIGINT,
    logs_last_30_days BIGINT,
    most_active_table TEXT,
    most_active_user TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '7 days') as last_7_days,
            COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '30 days') as last_30_days
        FROM audit_logs
    ),
    most_active_table AS (
        SELECT table_name
        FROM audit_logs
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY table_name
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ),
    most_active_user AS (
        SELECT user_email
        FROM audit_logs
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        AND user_email IS NOT NULL
        GROUP BY user_email
        ORDER BY COUNT(*) DESC
        LIMIT 1
    )
    SELECT 
        s.total,
        s.last_7_days,
        s.last_30_days,
        mat.table_name,
        mau.user_email
    FROM stats s
    CROSS JOIN most_active_table mat
    CROSS JOIN most_active_user mau;
END;
$$ LANGUAGE plpgsql;