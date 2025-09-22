#!/bin/bash

# Script de instalação completa do projeto
# Execute este script após criar o projeto Next.js

echo "🚀 Iniciando configuração do projeto de controle de versões..."

# Instalar dependências principais
echo "📦 Instalando dependências do Supabase..."
npm install @supabase/auth-helpers-nextjs @supabase/ssr @supabase/supabase-js

echo "📦 Instalando dependências de UI..."
npm install lucide-react sonner

echo "📦 Instalando utilitários..."
npm install date-fns react-hook-form @tanstack/react-query clsx tailwind-merge

echo "📦 Instalando tipos TypeScript..."
npm install -D @types/node @types/react @types/react-dom

# Criar estrutura de pastas
echo "📁 Criando estrutura de pastas..."

mkdir -p src/app/auth/login
mkdir -p src/app/auth/callback
mkdir -p src/app/dashboard
mkdir -p src/app/modules/new
mkdir -p src/app/modules/\[id\]/edit
mkdir -p src/app/clients/new
mkdir -p src/app/clients/\[id\]/edit
mkdir -p src/app/versions/new
mkdir -p src/app/versions/\[id\]/edit
mkdir -p src/app/reports
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/forms
mkdir -p src/lib/supabase
mkdir -p src/lib/types
mkdir -p src/hooks
mkdir -p src/utils

echo "✅ Estrutura de pastas criada!"

# Criar arquivo .env.local (template)
echo "📝 Criando arquivo .env.local (template)..."
cat > .env.local.example << EOF
# Copie este arquivo para .env.local e preencha com suas credenciais do Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EOF

echo "✅ Arquivo .env.local.example criado!"

# Instruções finais
echo ""
echo "========================================="
echo "✅ Configuração inicial concluída!"
echo "========================================="
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Configure o Supabase:"
echo "   - Crie um projeto em https://supabase.com"
echo "   - Execute o SQL fornecido no arquivo 'Setup e Configuração do Projeto'"
echo ""
echo "2. Configure as variáveis de ambiente:"
echo "   - Copie .env.local.example para .env.local"
echo "   - Adicione suas credenciais do Supabase"
echo ""
echo "3. Copie os arquivos do projeto para suas respectivas pastas"
echo ""
echo "4. Execute o projeto:"
echo "   npm run dev"
echo ""
echo "🌐 Acesse: http://localhost:3000"
echo "========================================="