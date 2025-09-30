#!/bin/bash

echo "🧹 Limpando cache para melhorar performance..."

# Parar todos os processos Next.js
echo "🛑 Parando processos Next.js existentes..."
pkill -f "next dev" 2>/dev/null || echo "   Nenhum processo Next.js ativo"

# Limpar cache do Next.js
echo "🗑️  Limpando cache do Next.js..."
rm -rf .next/
rm -rf .next/cache/

# Limpar cache do npm
echo "🗑️  Limpando cache do npm..."
npm cache clean --force

# Limpar node_modules e reinstalar (opcional - descomente se necessário)
# echo "🗑️  Reinstalando node_modules..."
# rm -rf node_modules/
# npm install

# Limpar cache do TypeScript
echo "🗑️  Limpando cache do TypeScript..."
rm -rf node_modules/.cache/
rm -f tsconfig.tsbuildinfo

# Verificar memória disponível
echo "💾 Status da memória:"
free -h

# Verificar processos Node.js rodando
echo "🔍 Processos Node.js ativos:"
ps aux | grep node | grep -v grep | wc -l
echo "   processos encontrados"

echo "✅ Limpeza concluída!"
echo "🚀 Agora execute: npm run dev"

# Backup da configuração atual e aplicar otimizada
if [ -f "next.config.mjs" ]; then
    echo "📁 Fazendo backup da configuração atual..."
    cp next.config.mjs next.config.backup.mjs
fi

if [ -f "next.config.optimized.mjs" ]; then
    echo "⚡ Aplicando configuração otimizada..."
    cp next.config.optimized.mjs next.config.mjs
    echo "✅ Configuração otimizada aplicada!"
fi