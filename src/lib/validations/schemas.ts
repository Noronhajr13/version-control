import { z } from 'zod'

// Schema de validação para Módulos
export const moduleSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Nome contém caracteres inválidos')
})

// Schema de validação para Clientes
export const clientSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres')
    .regex(/^[a-zA-Z0-9\s\-_.&]+$/, 'Nome contém caracteres inválidos'),
  uf: z.string()
    .length(2, 'UF deve ter exatamente 2 caracteres')
    .regex(/^[A-Z]{2}$/, 'UF deve conter apenas letras maiúsculas')
})

// Schema de validação para Versões
export const versionSchema = z.object({
  module_id: z.string()
    .min(1, 'Módulo é obrigatório'),
  tag: z.string()
    .min(1, 'Tag é obrigatória')
    .max(50, 'Tag deve ter no máximo 50 caracteres')
    .regex(/^v?[0-9]+\.[0-9]+(\.[0-9]+)?(-[a-zA-Z0-9]+)?$/, 'Tag deve seguir o padrão: v1.2.3 ou 1.2.3'),
  version_number: z.string()
    .min(1, 'Número da versão é obrigatório')
    .max(20, 'Número da versão deve ter no máximo 20 caracteres')
    .regex(/^[0-9]+\.[0-9]+(\.[0-9]+)?$/, 'Número da versão deve seguir o padrão: 1.2.3'),
  jira_card: z.string()
    .optional()
    .refine((val: string | undefined) => !val || /^[A-Z]+-[0-9]+$/.test(val), 'Card Jira deve seguir o padrão: ABC-123'),
  themes_folder: z.string()
    .optional()
    .refine((val: string | undefined) => !val || val.length <= 500, 'Pasta de temas deve ter no máximo 500 caracteres'),
  release_date: z.string()
    .optional()
    .refine((val: string | undefined) => !val || !isNaN(Date.parse(val)), 'Data de liberação inválida'),
  scripts: z.string()
    .optional()
    .refine((val: string | undefined) => !val || val.length <= 5000, 'Scripts deve ter no máximo 5000 caracteres'),
  powerbuilder_version: z.string()
    .min(1, 'PowerBuilder version é obrigatória')
    .max(50, 'PowerBuilder version muito longa'),
  description: z.string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres'),
  status: z.enum(['interna', 'teste', 'homologacao', 'producao', 'deprecated'], {
    message: 'Status deve ser: interna, teste, homologação, produção ou deprecated'
  }),
  data_generation: z.string()
    .min(1, 'Data de geração é obrigatória')
    .refine((val: string) => !isNaN(Date.parse(val)), 'Data de geração inválida')
    .refine((val: string) => {
      const date = new Date(val)
      const now = new Date()
      return date <= now
    }, 'Data de geração não pode ser no futuro')
})

// Schema para Cards Jira
export const cardSchema = z.object({
  jira_number: z.string()
    .min(1, 'Número do card Jira é obrigatório')
    .regex(/^[A-Z]+-[0-9]+$/, 'Card Jira deve seguir o padrão: ABC-123'),
  last_update: z.string()
    .min(1, 'Data de atualização é obrigatória')
    .refine((val: string) => !isNaN(Date.parse(val)), 'Data de atualização inválida')
})

// Schema para autenticação
export const authSchema = z.object({
  email: z.string()
    .min(1, 'Email é obrigatório')
    .email('Email deve ter um formato válido')
    .max(254, 'Email deve ter no máximo 254 caracteres'),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres')
})

// Tipos TypeScript derivados dos schemas
export type ModuleFormData = z.infer<typeof moduleSchema>
export type ClientFormData = z.infer<typeof clientSchema>
export type VersionFormData = z.infer<typeof versionSchema>
export type CardFormData = z.infer<typeof cardSchema>
export type AuthFormData = z.infer<typeof authSchema>

// Estados brasileiros para validação
export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const