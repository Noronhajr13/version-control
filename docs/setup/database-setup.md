# 🏗️ Setup Completo da Base de Dados - Version Control App

## 📋 Resumo da Situação

**Problema identificado:** RPC `sql()` não está disponível no seu projeto Supabase, então precisamos usar método manual.

**Estrutura necessária:**
- 6 tabelas principais: `user_profiles`, `modules`, `clients`, `versions`, `version_clients`, `cards`
- Funções automáticas e triggers
- Políticas de segurança (RLS)
- Usuário administrador inicial

## 🚀 Método Recomendado (Manual via Painel Supabase)

### Passo 1: Diagnóstico
1. Acesse: https://console.supabase.co
2. Entre no seu projeto
3. Vá em **SQL Editor**
4. Execute o script: `sql/DIAGNOSTIC_AND_CLEANUP.sql`
5. Analise os resultados

### Passo 2: Setup da Estrutura
1. No mesmo **SQL Editor**  
2. Execute o script: `sql/COMPLETE_DATABASE_SETUP.sql`
3. Aguarde alguns segundos (vai criar tudo)
4. Verifique se não há erros vermelhos

### Passo 3: Criar Usuário Admin
1. No painel Supabase, vá em **Authentication** > **Users**
2. Clique em **Add user**
3. Email: `admin@test.com`
4. Password: `123456`
5. Clique **Send**

### Passo 4: Teste Final
1. Acesse: http://localhost:3001/auth/login
2. Faça login com: `admin@test.com` / `123456`
3. Se funcionar: ✅ **SUCESSO!**

## 🔧 Método Alternativo (Automático via App)

Se quiser tentar o método automático:

1. Acesse: http://localhost:3001/database-setup
2. Clique em **"Executar Setup Completo"**
3. Aguarde e veja os resultados
4. Se der erro de RPC, use o método manual acima

## 📁 Arquivos Criados

```
sql/
├── DIAGNOSTIC_AND_CLEANUP.sql     # 🔍 Verifica estado atual
├── COMPLETE_DATABASE_SETUP.sql    # 🏗️ Cria estrutura completa
└── create-admin-user.sql          # 👤 Scripts manuais do usuário

src/app/
├── database-setup/page.tsx        # 🖥️ Interface web automática
├── diagnostic/page.tsx             # 📊 Diagnóstico no browser
└── setup/page.tsx                  # ⚙️ Setup básico

test-database-setup.js              # 🧪 Teste de conectividade
```

## 🎯 Estrutura que será criada

### Tabelas:
- ✅ **user_profiles** - Perfis de usuários com roles
- ✅ **modules** - Módulos do sistema  
- ✅ **clients** - Clientes com UF
- ✅ **versions** - Versões com file_path padronizado
- ✅ **version_clients** - Relacionamento versões ↔ clientes
- ✅ **cards** - Cards/tarefas JIRA

### Funcionalidades:
- ✅ **Triggers automáticos** - `updated_at` automático
- ✅ **RLS habilitado** - Segurança por linha
- ✅ **Índices otimizados** - Performance de queries
- ✅ **Foreign Keys** - Integridade referencial

### Roles de usuário:
- `super_admin` - Acesso total
- `admin` - Administração geral  
- `manager` - Gerenciamento
- `editor` - Edição de dados
- `viewer` - Apenas visualização

## ⚠️ Troubleshooting

### Se der erro "tabela já existe":
- Normal, o script tem `IF NOT EXISTS`
- Verifique se a estrutura está correta

### Se der erro de permissão:
- Certifique-se que está logado como owner do projeto
- Verifique se o RLS não está bloqueando

### Se não conseguir fazer login:
1. Verifique se usuário foi criado em Auth > Users
2. Confirme se perfil existe em `user_profiles`
3. Use o diagnóstico: http://localhost:3001/diagnostic

## 🎉 Resultado Esperado

Após concluir:
- ✅ Sistema com 6 tabelas funcionais
- ✅ Login funcionando: `admin@test.com` / `123456`
- ✅ Dashboard acessível
- ✅ Todas as funcionalidades do app operacionais
- ✅ Campos `file_path` padronizados
- ✅ Sistema em produção: https://version-control-app-wheat.vercel.app

## 📞 Se ainda houver problemas:

1. **Verifique logs**: Console do navegador + Network tab
2. **Teste direto**: http://localhost:3001/diagnostic  
3. **Compare estruturas**: Execute `DIAGNOSTIC_AND_CLEANUP.sql` antes e depois
4. **Recrie do zero**: Descomente seção LIMPEZA no script de diagnóstico

---

**🚀 Status**: Pronto para execução  
**⏱️ Tempo estimado**: 5-10 minutos  
**🎯 Objetivo**: Sistema 100% funcional com login