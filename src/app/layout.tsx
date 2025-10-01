import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './global.css'
import { Toaster } from 'sonner'
import QueryProvider from '../lib/react-query/QueryProvider'
import { AuthProvider } from '@/contexts/AuthContextBasic'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Controle de Versões',
  description: 'Sistema de controle de versões de software',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            {children}
            <Toaster position="top-right" />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}