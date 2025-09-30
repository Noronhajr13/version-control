import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações específicas para desenvolvimento
  ...(process.env.NODE_ENV === 'development' && {
    // Disable source maps in development for faster builds
    experimental: {
      optimizePackageImports: [
        'lucide-react',
        '@supabase/ssr', 
        '@tanstack/react-query',
        'react',
        'react-dom'
      ],
      // Faster builds
      turbo: {
        rules: {
          '*.svg': {
            loaders: ['@svgr/webpack'],
            as: '*.js',
          },
        },
      },
    },
    // Faster dev server
    onDemandEntries: {
      // Period (in ms) where the server will keep pages in the buffer
      maxInactiveAge: 25 * 1000,
      // Number of pages that should be kept simultaneously without being disposed
      pagesBufferLength: 2,
    },
  }),

  // Otimizações gerais
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@supabase/ssr', 
      '@tanstack/react-query',
      'react',
      'react-dom'
    ],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Tree shaking mais agressivo apenas em produção
  webpack: (config, { dev, isServer }) => {
    // Otimizações para desenvolvimento
    if (dev) {
      // Faster development builds
      config.optimization.usedExports = false
      config.optimization.sideEffects = false
      
      // Reduce memory usage
      config.optimization.minimize = false
      config.optimization.concatenateModules = false
      
      return config
    }

    // Otimizações para produção
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