const fs = require('fs');
const path = require('path');

// Análise dos chunks baseada na saída do build
console.log('📊 ANÁLISE DE BUNDLE - VERSION CONTROL APP\n');

// Dados da saída do build
const routes = [
  { path: '/', size: '140 B', firstLoad: '102 kB' },
  { path: '/auth/login', size: '1.72 kB', firstLoad: '156 kB' },
  { path: '/dashboard', size: '503 B', firstLoad: '103 kB' },
  { path: '/dashboard/clients', size: '1.5 kB', firstLoad: '159 kB' },
  { path: '/dashboard/clients/[id]/edit', size: '2.21 kB', firstLoad: '160 kB' },
  { path: '/dashboard/clients/new', size: '1.41 kB', firstLoad: '159 kB' },
  { path: '/dashboard/modules', size: '2.07 kB', firstLoad: '168 kB' },
  { path: '/dashboard/modules/[id]/edit', size: '1.42 kB', firstLoad: '159 kB' },
  { path: '/dashboard/modules/new', size: '1.24 kB', firstLoad: '159 kB' },
  { path: '/dashboard/reports', size: '1.91 kB', firstLoad: '104 kB' },
  { path: '/dashboard/versions', size: '1.68 kB', firstLoad: '159 kB' },
  { path: '/dashboard/versions/[id]', size: '3.57 kB', firstLoad: '152 kB' },
  { path: '/dashboard/versions/[id]/edit', size: '3.61 kB', firstLoad: '161 kB' },
  { path: '/dashboard/versions/new', size: '2.01 kB', firstLoad: '107 kB' }
];

const sharedChunks = {
  total: '102 kB',
  chunks: [
    { name: 'chunks/255-40634877ae3e8e9d.js', size: '45.7 kB' },
    { name: 'chunks/4bd1b696-c023c6e3521b1417.js', size: '54.2 kB' },
    { name: 'other shared chunks', size: '2.05 kB' }
  ]
};

console.log('🔍 SHARED CHUNKS ANALYSIS:');
console.log(`Total shared JS: ${sharedChunks.total}`);
sharedChunks.chunks.forEach(chunk => {
  console.log(`  - ${chunk.name}: ${chunk.size}`);
});

console.log('\n🎯 ROUTES WITH HIGHEST FIRST LOAD:');
const sortedByFirstLoad = routes
  .map(route => ({
    ...route,
    firstLoadKB: parseFloat(route.firstLoad.replace(' kB', ''))
  }))
  .sort((a, b) => b.firstLoadKB - a.firstLoadKB)
  .slice(0, 5);

sortedByFirstLoad.forEach(route => {
  console.log(`  ${route.path}: ${route.firstLoad}`);
});

console.log('\n📈 ROUTE SIZE ANALYSIS:');
routes.forEach(route => {
  const sizeKB = route.size.includes('kB') ? 
    parseFloat(route.size.replace(' kB', '')) : 
    parseFloat(route.size.replace(' B', '')) / 1000;
  
  if (sizeKB > 2) {
    console.log(`  ⚠️  ${route.path}: ${route.size} (Large route)`);
  }
});

console.log('\n🚨 OPTIMIZATION OPPORTUNITIES:');
console.log('1. Shared chunks são grandes (102kB total)');
console.log('2. Módules page tem highest first load (168kB)');
console.log('3. Version edit pages são as maiores (3.57kB e 3.61kB)');
console.log('4. Middleware está grande (70.2kB)');

console.log('\n💡 RECOMMENDED ACTIONS:');
console.log('1. Implementar tree shaking para dependências não utilizadas');
console.log('2. Code splitting adicional para forms complexos');
console.log('3. Otimizar imports do Supabase (warnings detectados)');
console.log('4. Implementar dynamic imports para componentes pesados');
console.log('5. Revisar middleware size e dependências');

// Análise específica de warnings
console.log('\n⚠️  SUPABASE WARNINGS DETECTED:');
console.log('- Node.js APIs in Edge Runtime (process.versions, process.version)');
console.log('- Impacto no middleware.ts');
console.log('- Recomendação: Conditional imports ou edge-compatible alternatives');