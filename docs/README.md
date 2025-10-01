# 📚 Documentação do Sistema de Controle de Versões

Este diretório contém toda a documentação do projeto organizada por categorias.

## 📁 Estrutura da Documentação

### 🔧 [Setup](./setup/)
Documentação de configuração e instalação:
- **[Database Setup](./setup/database-setup.md)** - Configuração completa do banco de dados Supabase
- **[Email Confirmation](./setup/email-confirmation.md)** - Guia para confirmação de email
- **[Workflow](./setup/workflow.md)** - Fluxo de trabalho com branches Git

### 💻 [Development](./development/) 
Documentação de desenvolvimento:
- **[Migration AuthContext](./development/migration-authcontext.md)** - Migração completa do sistema de autenticação
- **[Error Reports](./development/error-reports.md)** - Relatórios de erros críticos e soluções

### 📝 [Project](./project/)
Documentação do projeto:
- **[Claude Sessions](./project/claude-sessions.md)** - Histórico de sessões e desenvolvimento com Claude

### 📦 [Archive](./archive/)
Documentos históricos e arquivos de referência.

## 🚀 Início Rápido

### Para Setup Inicial:
1. Leia [Database Setup](./setup/database-setup.md) para configurar o Supabase
2. Configure [Email Confirmation](./setup/email-confirmation.md) se necessário
3. Siga o [Workflow](./setup/workflow.md) para desenvolvimento

### Para Desenvolvimento:
1. Consulte [Migration AuthContext](./development/migration-authcontext.md) para entender a autenticação
2. Veja [Error Reports](./development/error-reports.md) para soluções de problemas conhecidos

## 📖 Outras Documentações

- **[Dev Tools](../dev/README.md)** - Ferramentas de desenvolvimento e debug
- **[Main README](../README.md)** - Documentação principal do projeto

## 🔍 Como Encontrar Informações

- **Problemas de setup?** → `setup/`
- **Erros de desenvolvimento?** → `development/`
- **Histórico do projeto?** → `project/`
- **Ferramentas de debug?** → `../dev/`

## 📝 Contribuindo com a Documentação

Para adicionar nova documentação:
1. Escolha a categoria apropriada (`setup/`, `development/`, `project/`)
2. Crie o arquivo markdown
3. Atualize este índice
4. Faça commit com prefixo `docs:`

---
*Última atualização: ${new Date().toLocaleDateString('pt-BR')}*
*Organizado em: branch development*