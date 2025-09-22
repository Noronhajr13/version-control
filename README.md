# 🚀 Sistema de Controle de Versões

Sistema completo para controle de versões de produtos com autenticação, gerenciamento de módulos, clientes e versões integrado com Supabase.

## � Descrição do Projeto

Este é um sistema web desenvolvido para gerenciar o controle de versões de produtos de software, permitindo o acompanhamento de:

- **Módulos**: Componentes principais do sistema
- **Clientes**: Empresas que utilizam as versões
- **Versões**: Releases dos módulos com cards Jira associados
- **Relatórios**: Análises e visualizações dos dados

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 14.2.3** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide React** - Biblioteca de ícones
- **Sonner** - Sistema de notificações toast

### Backend & Banco de Dados
- **Supabase** - BaaS (Backend as a Service)
  - PostgreSQL como banco de dados
  - Autenticação integrada
  - Row Level Security (RLS)
  - Realtime subscriptions

### Utilitários
- **date-fns** - Manipulação de datas
- **react-hook-form** - Gerenciamento de formulários
- **clsx + tailwind-merge** - Combinação de classes CSS
- **@tanstack/react-query** - Cache e sincronização de dados

## 🏗️ Arquitetura do Projeto

```
version-control-app/
├── src/
│   ├── app/                    # App Router do Next.js
│   │   ├── auth/              # Sistema de autenticação
│   │   │   ├── login/         # Página de login/cadastro
│   │   │   └── callback/      # Callback do Supabase Auth
│   │   ├── dashboard/         # Layout principal protegido
│   │   ├── modules/           # CRUD de módulos
│   │   ├── clients/           # CRUD de clientes
│   │   ├── versions/          # CRUD de versões
│   │   ├── reports/           # Relatórios e análises
│   │   └── api/               # API routes
│   ├── components/            # Componentes reutilizáveis
│   │   ├── ui/               # Componentes de interface
│   │   ├── layout/           # Componentes de layout
│   │   └── forms/            # Componentes de formulários
│   ├── lib/                  # Configurações e utilitários
│   │   ├── supabase/         # Configurações do Supabase
│   │   └── types/            # Definições de tipos TypeScript
│   ├── hooks/                # Custom React Hooks
│   └── utils/                # Funções utilitárias
├── public/                   # Arquivos estáticos
└── config files             # Configurações do projeto
```

## 🗄️ Modelo de Dados

### Tabelas Principais

**modules**
```sql
- id (uuid, primary key)
- name (text)
- created_at (timestamp)
```

**clients**
```sql
- id (uuid, primary key)
- name (text)
- uf (text) -- Estado brasileiro
- created_at (timestamp)
```

**versions**
```sql
- id (uuid, primary key)
- module_id (uuid, foreign key)
- tag (text) -- Ex: v4.24.83
- version_number (text) -- Ex: 4.24083.00
- jira_card (text, optional) -- Link principal do Jira
- themes_folder (text, optional)
- release_date (date, optional)
- script_executed (text, optional)
- created_at (timestamp)
```

**cards**
```sql
- id (uuid, primary key)
- version_id (uuid, foreign key)
- jira_number (text) -- Número ou link do card
- last_update (date)
```

**version_clients** (tabela de relacionamento)
```sql
- id (uuid, primary key)
- version_id (uuid, foreign key)
- client_id (uuid, foreign key)
```

## 🔧 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no [Supabase](https://supabase.com)

### 1. Clone e Instale Dependências
```bash
git clone <repo-url>
cd version-control-app
npm install
```

### 2. Configure o Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o SQL de criação das tabelas (disponível na documentação)
3. Configure as políticas RLS
4. Obtenha a URL e chave anônima do projeto

### 3. Variáveis de Ambiente
Crie `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_projeto
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 4. Execute o Projeto
```bash
npm run dev
```

Acesse: `http://localhost:3000`

## 🎯 Funcionalidades Implementadas

### ✅ Sistema de Autenticação
- Login/Cadastro com email e senha
- Proteção de rotas
- Logout seguro
- Redirecionamento automático

### ✅ Gerenciamento de Módulos
- Listagem com paginação
- Criação de novos módulos
- Edição de módulos existentes
- Exclusão com confirmação

### ✅ Gerenciamento de Clientes
- CRUD completo
- Seleção de UF (estados brasileiros)
- Validação de dados
- Interface responsiva

### ✅ Gerenciamento de Versões
- Criação de versões associadas a módulos
- Múltiplos cards Jira por versão
- Associação com múltiplos clientes
- Scripts SQL executados
- Visualização detalhada

### ✅ Relatórios
- Versões por módulo
- Clientes por versão
- Filtros dinâmicos
- Interface intuitiva

### ✅ Interface e UX
- Dark mode implementado
- Design responsivo
- Notificações toast
- Loading states
- Tratamento de erros

## � Segurança Implementada

- **Row Level Security (RLS)** habilitado no Supabase
- **Autenticação obrigatória** para todas as operações
- **Validação de dados** no frontend e backend
- **Middleware de autenticação** do Next.js
- **Tipagem TypeScript** para segurança de tipos

## 🎨 Personalização

### Temas e Cores
O sistema utiliza CSS Custom Properties para temas:
```css
/* Light mode */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... */
}

/* Dark mode */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

### Componentes UI Reutilizáveis
- `Button` - Botão com variants e estados
- `Input` - Campo de entrada com validação
- `Card` - Container de conteúdo
- `Badge` - Marcadores coloridos
- `EmptyState` - Estado vazio com ações

## 📊 Performance e Otimizações

### Implementadas
- **Server Components** para reduzir bundle JavaScript
- **Client Components** apenas quando necessário
- **TypeScript strict** para detecção precoce de erros
- **Tailwind CSS** para CSS otimizado
- **Image optimization** do Next.js (quando aplicável)

### Padrões de Código
- **Separation of Concerns** - Lógica separada da apresentação
- **Custom Hooks** - Reutilização de lógica
- **TypeScript** - Tipagem forte e interfaces bem definidas
- **Error Boundaries** - Tratamento de erros gracioso

## 🧪 Testes (Planejado)

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm run build
vercel deploy
```

### Outras Plataformas
- Netlify
- Railway
- AWS Amplify

## 📈 Roadmap e Melhorias Futuras

### Funcionalidades Planejadas
- [ ] **Dashboard com métricas** - Gráficos e estatísticas
- [ ] **Histórico de alterações** - Auditoria completa
- [ ] **Upload de arquivos** - Anexos nas versões
- [ ] **Notificações em tempo real** - WebSockets
- [ ] **API REST** - Endpoints para integração
- [ ] **Backup automático** - Sincronização de dados
- [ ] **Multi-tenancy** - Suporte a múltiplas organizações

### Melhorias Técnicas
- [ ] **Testes automatizados** - Jest + React Testing Library
- [ ] **CI/CD Pipeline** - GitHub Actions
- [ ] **Monitoramento** - Sentry para erros
- [ ] **Analytics** - Plausible ou GA4
- [ ] **Documentação API** - Swagger/OpenAPI

## 🤝 Contribuição

### Padrões de Commit
```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
style: formatação de código
refactor: refatoração sem mudança de funcionalidade
test: adiciona testes
chore: tarefas de manutenção
```

### Workflow
1. Fork do projeto
2. Criar branch feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit das alterações (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para branch (`git push origin feature/nova-funcionalidade`)
5. Abrir Pull Request

## 📞 Suporte e Documentação

### Links Úteis
- [Documentação do Supabase](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

### Troubleshooting

**Problema**: Erro de conexão com Supabase
**Solução**: Verifique as variáveis de ambiente e configurações RLS

**Problema**: Erro de build do TypeScript
**Solução**: Execute `npm run build` e corrija os erros de tipagem

**Problema**: CSS não aplicado
**Solução**: Verifique se o Tailwind está configurado corretamente

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para detalhes.

---

**Desenvolvido com ❤️ usando Next.js, TypeScript e Supabase**