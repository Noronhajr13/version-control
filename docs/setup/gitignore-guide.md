# 🚫 Configuração do .gitignore

## 📋 Sobre

O arquivo `.gitignore` foi configurado de forma profissional com seções organizadas para diferentes aspectos do desenvolvimento.

## 🏗️ Estrutura das Seções

### 🔧 **Development Tools (Opcional)**
- Pasta `dev/` pode ser ignorada em produção
- Scripts de teste e debug
- Componentes de desenvolvimento

### 🗄️ **Database & Backups** 
- Backups automáticos (.sql.backup, .dump)
- Arquivos temporários do Supabase
- Bancos locais SQLite

### 💻 **IDE & Editors**
- Configurações do VS Code (parcial)
- Arquivos do JetBrains IDEs
- Arquivos temporários Vim/Emacs

### 📋 **Logs & Temporary**
- Logs de aplicação e npm/yarn
- Diretórios temporários
- Cache files

### 🔒 **Security & Sensitive**
- Chaves API e certificados
- Tokens de autenticação
- Arquivos de configuração sensível

### 🎯 **Project Specific**
- Uploads de usuários
- Arquivos de clientes
- Archives de versões

## ⚙️ Configurações da Equipe

### Arquivos Commitados (Equipe):
- `.vscode/extensions.json` - Extensões recomendadas
- `.vscode/settings.json.example` - Configurações exemplo
- `.gitignore.example` - Guia de configuração

### Arquivos Ignorados (Individual):
- `.vscode/settings.json` - Configurações pessoais
- `.env.local` - Variáveis locais
- Arquivos temporários pessoais

## 🚀 Para Produção

Para deploy em produção, descomente esta linha no .gitignore:
```gitignore
dev/
```

Isso excluirá todas as ferramentas de desenvolvimento do build.

## 🛠️ Comandos Úteis

```bash
# Ver arquivos ignorados
git status --ignored

# Verificar se arquivo específico está sendo ignorado  
git check-ignore -v arquivo.txt

# Forçar adição de arquivo ignorado
git add -f arquivo.txt

# Limpar cache do git após mudanças no .gitignore
git rm -r --cached .
git add .
```

## 📝 Contribuindo

Ao adicionar novos tipos de arquivos:
1. Adicione na seção apropriada
2. Mantenha comentários explicativos
3. Teste com `git status --ignored`
4. Atualize esta documentação

---
*Configuração profissional para desenvolvimento e produção*