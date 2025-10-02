# 🗄️ Scripts SQL - Sistema de Controle de Versões

Esta pasta contém todos os scripts SQL organizados por finalidade para facilitar manutenção e uso.

## 📁 Estrutura Organizada

### 🔧 [Setup](./setup/) - Configuração Inicial
Scripts para configuração inicial do banco de dados:

- **[complete_database_setup.sql](./setup/complete_database_setup.sql)** - Setup completo do banco
- **[create_basic_structure.sql](./setup/create_basic_structure.sql)** - Estrutura básica das tabelas

### 🔄 [Migrations](./migrations/) - Migrações de Schema
Scripts de migração numerados em ordem de execução:

- **[10_complete_database_rebuild.sql](./migrations/10_complete_database_rebuild.sql)** - Reconstrução completa
- **[11_rls_policies_main_tables.sql](./migrations/11_rls_policies_main_tables.sql)** - Políticas RLS principais
- **[12_master_migration_script.sql](./migrations/12_master_migration_script.sql)** - Script mestre de migração
- **[migration_simple.sql](./migrations/migration_simple.sql)** - Migração simplificada

### 🛠️ [Maintenance](./maintenance/) - Manutenção
Scripts para manutenção e análise do banco:

- **[diagnostic_and_cleanup.sql](./maintenance/diagnostic_and_cleanup.sql)** - Diagnóstico e limpeza
- **[analyze_database_structure.sql](./maintenance/analyze_database_structure.sql)** - Análise da estrutura
- **[update_file_system.sql](./maintenance/update_file_system.sql)** - Atualização do sistema de arquivos

### 🔧 [Fixes](./fixes/) - Correções
Scripts para correção de problemas específicos:

- **[fix_rls_problem.sql](./fixes/fix_rls_problem.sql)** - Correção de problemas RLS
- **[confirm_email_and_fix.sql](./fixes/confirm_email_and_fix.sql)** - Correção confirmação de email

### ⚙️ [Functions](./functions/) - Funções RPC
Funções personalizadas do Supabase:

- **[supabase_rpc_functions.sql](./functions/supabase_rpc_functions.sql)** - Funções RPC principais

### 👤 [Admin](./admin/) - Scripts Administrativos
Scripts para administração do sistema:

- **[create_admin_user.sql](./admin/create_admin_user.sql)** - Criação de usuário administrador

## 🚀 Como Usar

### Para Setup Inicial:
1. Execute scripts em `setup/` na ordem alfabética
2. Configure as variáveis de ambiente necessárias
3. Execute `admin/create_admin_user.sql` para criar usuário admin

### Para Migrações:
1. Execute scripts em `migrations/` na ordem numérica (10, 11, 12...)
2. Sempre faça backup antes de executar migrações
3. Teste primeiro em ambiente de desenvolvimento

### Para Manutenção:
- Use scripts em `maintenance/` conforme necessário
- `diagnostic_and_cleanup.sql` pode ser executado periodicamente
- `analyze_database_structure.sql` para análise de estrutura

### Para Correções:
- Execute scripts em `fixes/` apenas quando necessário
- Leia os comentários no script antes de executar
- Faça backup antes de executar correções

## ⚠️ Importantes Considerações

### Ordem de Execução:
1. **Setup** → Configuração inicial
2. **Migrations** → Migrações (ordem numérica)
3. **Admin** → Usuários administrativos
4. **Functions** → Funções personalizadas
5. **Fixes** → Apenas se necessário
6. **Maintenance** → Conforme demanda

### Segurança:
- ⚠️ **SEMPRE** faça backup antes de executar scripts
- ✅ Teste em ambiente de desenvolvimento primeiro
- ✅ Leia completamente o script antes de executar
- ✅ Verifique se tem as permissões necessárias

### Ambiente:
- 🟢 **Desenvolvimento:** Pode executar todos os scripts
- 🟡 **Staging:** Cuidado com scripts de maintenance
- 🔴 **Produção:** Extremo cuidado, sempre com backup

## 📝 Contribuindo

Para adicionar novos scripts:
1. Escolha a categoria apropriada
2. Use nomenclatura snake_case
3. Adicione comentários explicativos
4. Atualize este README
5. Teste antes de commitar

---
*Última atualização: ${new Date().toLocaleDateString('pt-BR')}*
*Organizado em: branch development*