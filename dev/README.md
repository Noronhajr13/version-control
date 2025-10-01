# 🛠️ Pasta de Desenvolvimento

Esta pasta contém todos os arquivos relacionados ao desenvolvimento, debug e testes do projeto.

## 📁 Estrutura

### `pages/`
Páginas utilizadas apenas para desenvolvimento e debug:
- `database-setup/` - Interface para setup do banco de dados
- `diagnostic/` - Páginas de diagnóstico e testes
- `debug-auth/` - Debug de autenticação
- `login-test/` - Testes de login
- `setup/` - Configuração geral
- `migration/` - Scripts de migração

### `components/`
Componentes utilizados apenas em desenvolvimento:
- `debug/` - Componentes de debug e diagnóstico

### `scripts/`
Scripts Node.js para testes e manutenção:
- `test-*.js` - Scripts de teste
- `create-*.js` - Scripts de criação
- `fix-*.js` - Scripts de correção
- `diagnose-*.js` - Scripts de diagnóstico

## 🚫 Exclusão em Produção

Estes arquivos são excludos em produção através de:
- `.gitignore` (se configurado)
- Build process
- Deploy configuration

## 🔧 Como Usar

### Para acessar páginas de dev (apenas em desenvolvimento):
```
http://localhost:3001/database-setup
http://localhost:3001/diagnostic
http://localhost:3001/debug-auth
# etc...
```

### Para executar scripts:
```bash
cd dev/scripts
node test-supabase.js
node diagnose-redirect-problem.js
# etc...
```

## ⚠️ Importante

- Estes arquivos NÃO devem ser usados em produção
- São ferramentas de desenvolvimento e debug
- Podem expor informações sensíveis do sistema
- Sempre testar em ambiente de desenvolvimento

---
*Organizado em: ${new Date().toLocaleDateString('pt-BR')}*