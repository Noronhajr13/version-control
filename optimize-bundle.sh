#!/bin/bash

# Script de otimização automática de imports
echo "🔧 Aplicando otimizações de bundle..."

# Lista de arquivos para otimizar imports do lucide-react
files_to_optimize=(
  "src/components/forms/ConfirmDialog.tsx"
  "src/components/ui/EmptyState.tsx"
  "src/components/ui/LazyErrorBoundary.tsx"
  "src/components/layout/Header.tsx"
  "src/components/layout/Sidebar.tsx"
  "src/app/error.tsx"
  "src/app/not-found.tsx"
  "src/app/loading.tsx"
  "src/app/dashboard/clients/page.tsx"
  "src/app/dashboard/versions/page.tsx"
  "src/app/dashboard/clients/DeleteClientButton.tsx"
  "src/app/dashboard/clients/[id]/edit/page.tsx"
  "src/app/dashboard/modules/DeleteModuleButton.tsx"
  "src/app/dashboard/versions/[id]/page.tsx"
  "src/app/dashboard/modules/page.tsx"
  "src/app/dashboard/versions/[id]/edit/page.tsx"
)

echo "📁 Substituindo imports do lucide-react por barrel exports..."

for file in "${files_to_optimize[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ Otimizando $file"
    # Substitui import from 'lucide-react' por import from '@/src/components/ui/icons'
    sed -i "s|from 'lucide-react'|from '@/src/components/ui/icons'|g" "$file"
  else
    echo "  ⚠️ Arquivo não encontrado: $file"
  fi
done

echo "🏗️ Criando componentes otimizados..."

# Substituir página de modules pela versão otimizada
if [ -f "src/app/dashboard/modules/page.tsx" ]; then
  cp "src/app/dashboard/modules/page.tsx" "src/app/dashboard/modules/page.backup.tsx"
  cp "src/app/dashboard/modules/ModulesPageOptimized.tsx" "src/app/dashboard/modules/page.tsx"
  echo "  ✓ Modules page otimizada"
fi

echo "📊 Executando nova análise de bundle..."
npm run build

echo "✅ Otimizações aplicadas!"
echo ""
echo "📈 Para análise detalhada, execute:"
echo "npm run analyze"