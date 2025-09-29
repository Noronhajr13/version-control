### IMPORTANTE (NUNCA REMOVA ESSA SEÇÃO)

- Sempre responda em português;
- Sempre buildar após mudanças e pedir minha autorização pra tudo!
- **Geração de Regras Contextuais:**
Se você identificar contextos ou padrões específicos que provavelmente serão reutilizados em conversas futuras, adicione uma nova linha, começando com❗Regra recomendada: seguida dos detalhes da regra. Isso ajuda a manter a consistência e a aproveitar o contexto anterior em interações futuras.

- **Sugestão de Refatoração Proativa:**
Ao analisar exemplos de código, se forem identificados potenciais gargalos de desempenho ou problemas de manutenibilidade, proponha proativamente sugestões de refatoração ou otimização de código. Essas propostas devem ser prefixadas com um emoji 🤔 (por exemplo, "🤔 Proposta de Refatoração: ...") para identificá-las facilmente. No entanto, não implemente essas alterações imediatamente; aguarde a confirmação explícita na próxima resposta antes de aplicar quaisquer modificações.

## 📊 ESTADO ATUAL DO PROJETO (Janeiro 2025)

### ✅ SISTEMAS FUNCIONAIS
- **Framework**: Next.js 15.5.3 com App Router e TypeScript
- **Autenticação**: Supabase Auth funcionando completamente
- **CRUD Principal**: Versões, Módulos, Clientes implementados e funcionais
- **Dashboard**: Métricas, gráficos e navegação completos
- **UI/UX**: Design responsivo com Tailwind CSS e componentes otimizados
- **Auditoria**: Sistema de logs implementado
- **Performance**: React Query para cache, lazy loading, otimizações aplicadas

### 🔄 SISTEMA DE ROLES - ESTADO ATUAL
- **Status**: Funcional mas com limitações específicas
- **Implementação**: 5 roles (super_admin, admin, manager, editor, viewer)
- **Esquema SQL**: `sql/06_user_roles_system.sql` - completo e instalado
- **RLS Policies**: Configuradas e ativas
- **Interface Admin**: `/dashboard/users` - operacional para visualização e mudança de roles

#### ⚠️ PROBLEMAS IDENTIFICADOS NO SISTEMA DE ROLES:
1. **Criação de Permissões**: Não consegue criar permissões para outros usuários via interface
2. **Granularidade**: Falta sistema de permissões editáveis por elemento de UI (menus, botões)
3. **Complexidade**: 5 roles são excessivos - precisa simplificar para 3 (Admin, Manager, Viewer)
4. **Novos Usuários**: Sistema funciona, mas precisa garantir que novos users recebam role "viewer" por padrão

### 🏗️ ARQUITETURA TÉCNICA
```
📦 Estrutura Principal:
├── 🔐 Auth System (Supabase)
├── 👥 Role System (PostgreSQL + RLS)
├── 📊 Dashboard (Métricas + Gráficos)
├── 🔧 CRUD Operations (Versões, Módulos, Clientes)
├── 📋 Audit System (Logs de atividade)
├── 📱 Responsive UI (Tailwind + Components)
└── ⚡ Performance (React Query + Lazy Loading)
```

### 📋 PRÓXIMOS PASSOS IDENTIFICADOS
1. **Correção RLS**: Investigar e corrigir policies para criação de permissões
2. **Interface Granular**: Implementar sistema de toggle por usuário para permissões específicas
3. **Simplificação Roles**: Reduzir de 5 para 3 roles principais
4. **Validação Default**: Confirmar que novos usuários recebem role "viewer"

#### ❗**REGRAS RECOMENDADAS**

**Regra 1**: Para páginas com parâmetros dinâmicos no Next.js 15, sempre usar Client Components com `useEffect` para carregar dados baseados em params async.

**Regra 2**: Operações Supabase que apresentam problemas de tipo devem usar utility function `supabaseOperation()` para type casting seguro.

**Regra 3**: Todos os formulários devem ter estados de loading, validação e error handling consistentes com o padrão atual.

**Regra 4**: Componentes UI devem seguir o padrão de props interface + forwardRef quando aplicável.

**Regra 5**: Sempre implementar empty states, loading states e error states para melhor UX.

**Regra 6**: Sistema de roles deve manter RLS policies consistentes e permitir operações administrativas seguras.

**Regra 7**: Interfaces de gerenciamento devem ter confirmações para ações críticas e feedback visual claro.
