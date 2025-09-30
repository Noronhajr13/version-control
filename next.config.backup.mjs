import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@supabase/ssr', 
      '@tanstack/react-query'
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Tree shaking mais agressivo
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Otimizações para bundle client
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
      
      // Chunk splitting otimizado
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          supabase: {
            name: 'supabase',
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            chunks: 'all',
            priority: 10,
          },
          reactQuery: {
            name: 'react-query',
            test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query[\\/]/,
            chunks: 'all',
            priority: 10,
          },
          lucide: {
            name: 'lucide',
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            chunks: 'all',
            priority: 10,
          },
        },
      }
    }
    
    return config
  },
}

export default withBundleAnalyzer(nextConfig)
