
# 🚀 Guia de Migração - AuthContext Unificado

## 📋 Resumo
Você vai substituir **3 arquivos** por **1 único contexto centralizado**.

---

## 🗂️ PASSO 1: Criar o Novo Arquivo

### Criar: `src/contexts/AuthContext.tsx`
Copie o código do artifact "AuthContext - Solução Completa Unificada"

---

## 🔄 PASSO 2: Atualizar o Layout

### Editar: `app/layout.tsx` (ou `src/app/layout.tsx`)

```typescript
import { AuthProvider } from '@/src/contexts/AuthContext'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

---

## 🔍 PASSO 3: Encontrar Todos os Imports

### No terminal, execute:
```bash
# Encontrar todos os arquivos que usam os hooks antigos
grep -r "from.*useAuth" src/ --include="*.tsx" --include="*.ts"
grep -r "from.*usePermissions" src/ --include="*.tsx" --include="*.ts"  
grep -r "from.*useUIPermissions" src/ --include="*.tsx" --include="*.ts"
```

Ou no **VS Code**: `Ctrl + Shift + F` e buscar por cada import.

---

## ✏️ PASSO 4: Atualizar TODOS os Imports

### ❌ ANTES (3 imports diferentes):
```typescript
import { useAuth } from '@/src/hooks/useAuth'
import { usePermissions } from '@/src/hooks/usePermissions'
import { useUIPermissions } from '@/src/hooks/useUIPermissions'
```

### ✅ DEPOIS (1 único import):
```typescript
import { useAuth, usePermissions, useUIPermissions } from '@/src/contexts/AuthContext'
```

### Substituição Automática (opcional):
```bash
# Substitui imports automaticamente em todos os arquivos
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
  "s|from '@/src/hooks/useAuth'|from '@/src/contexts/AuthContext'|g" {} \;

find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
  "s|from '@/src/hooks/usePermissions'|from '@/src/contexts/AuthContext'|g" {} \;

find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
  "s|from '@/src/hooks/useUIPermissions'|from '@/src/contexts/AuthContext'|g" {} \;
```

---

## 🗑️ PASSO 5: Remover Arquivos Antigos

### Deletar (ou renomear para .old):
```bash
# Renomear para backup
mv src/hooks/useAuth.ts src/hooks/useAuth.ts.old
mv src/hooks/usePermissions.ts src/hooks/usePermissions.ts.old
mv src/hooks/useUIPermissions.ts src/hooks/useUIPermissions.ts.old

# Ou deletar permanentemente
rm src/hooks/useAuth.ts
rm src/hooks/usePermissions.ts
rm src/hooks/useUIPermissions.ts
```

---

## ✅ PASSO 6: Testar

### Iniciar o servidor:
```bash
npm run dev
```

### Verificar no Console:
Você deve ver:
- ✅ **1 cache hit** (ao invés de 50)
- ✅ **0 instâncias múltiplas**
- ✅ **Apenas 2-3 requisições** no total

### Antes:
```
🚨 Nova instância useAuth #1
🚨 Nova instância useAuth #2
...
🚨 Nova instância useAuth #51
📦 Cache hit (instância #1): user-id
📦 Cache hit (instância #2): user-id
...
📦 Cache hit (instância #50): user-id
```

### Depois:
```
🔍 Buscando perfil: user-id
✅ Last login atualizado
```

---

## 🎯 PASSO 7: Verificar Funcionalidade

### Teste essas funcionalidades:
- [ ] Login funciona
- [ ] Permissões funcionam (botões aparecem/desaparecem corretamente)
- [ ] UI permissions funcionam
- [ ] Logout funciona
- [ ] Atualização de perfil funciona

---

## 📊 Resultado Esperado

| Métrica | Antes | Depois | Melhoria |
|---------|-------|---------|----------|
| Instâncias useAuth | **51** | **1** | **-98%** |
| Cache hits | **50** | **1** | **-98%** |
| Requisições totais | 6-10 | 2-3 | **-70%** |
| Listeners | 51 | 1 | **-98%** |
| Re-renders | Muitos | Mínimos | **-95%** |

---

## 🐛 Troubleshooting

### Erro: "useAuth deve ser usado dentro de um AuthProvider"
**Causa:** Componente usando o hook fora do AuthProvider  
**Solução:** Verificar se `<AuthProvider>` está no layout raiz

### Erro: "Cannot read property 'role' of null"
**Causa:** Tentando acessar dados antes do loading terminar  
**Solução:** Sempre verificar `loading` ou `userProfile` antes de usar:
```typescript
const { userProfile, loading } = useAuth()

if (loading) return <div>Carregando...</div>
if (!userProfile) return null

// Agora pode usar userProfile.role com segurança
```

### Imports não atualizados
**Causa:** Ainda importando dos arquivos antigos  
**Solução:** Buscar por `@/src/hooks/use` e atualizar todos

---

## 🎉 Pronto!

Agora você tem:
- ✅ 1 única fonte de verdade para autenticação
- ✅ Todos os hooks centralizados
- ✅ 98% menos operações desnecessárias
- ✅ Performance otimizada
- ✅ Código mais limpo e manutenível