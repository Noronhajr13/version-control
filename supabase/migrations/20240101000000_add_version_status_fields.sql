-- Migration: Add status and data_generation fields to versions table
-- Created: 2024-01-01
-- Description: Adds status enum and generation date fields to improve version tracking

-- Create enum type for version status
CREATE TYPE version_status AS ENUM (
  'interna',
  'teste', 
  'homologacao',
  'producao',
  'deprecated'
);

-- Add new columns to versions table
ALTER TABLE versions 
ADD COLUMN IF NOT EXISTS status version_status DEFAULT 'interna',
ADD COLUMN IF NOT EXISTS data_generation DATE;

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_versions_status ON versions(status);
CREATE INDEX IF NOT EXISTS idx_versions_data_generation ON versions(data_generation);

-- Update any existing records to have default status
UPDATE versions SET status = 'interna' WHERE status IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN versions.status IS 'Status atual da versão no ciclo de desenvolvimento';
COMMENT ON COLUMN versions.data_generation IS 'Data em que a versão foi gerada';