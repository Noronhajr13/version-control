import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './global.css'
import { Toaster } from 'sonner'
import QueryProvider from '../lib/react-query/QueryProvider'
import { SimpleAuthProvider } from '@/src/contexts/SimpleAuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Controle de Versões - Modo Simples',
  description: 'Sistema de controle de versões (modo de debug)',
}

export default function SimpleRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <SimpleAuthProvider>
          <QueryProvider>
            {children}
            <Toaster position="top-right" />
          </QueryProvider>
        </SimpleAuthProvider>
      </body>
    </html>
  )
}