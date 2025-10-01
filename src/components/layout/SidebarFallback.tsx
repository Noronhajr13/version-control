'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Package, 
  Users, 
  GitBranch, 
  FileText, 
  Home,
  Clock,
  LogOut,
  Shield
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContextBasic'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/modules', label: 'Módulos', icon: Package },
  { href: '/dashboard/clients', label: 'Clientes', icon: Users },
  { href: '/dashboard/versions', label: 'Versões', icon: GitBranch },
  { href: '/dashboard/reports', label: 'Relatórios', icon: FileText },
  { href: '/dashboard/audit', label: 'Auditoria', icon: Clock },
]

const adminMenuItems = [
  { href: '/dashboard/users', label: 'Usuários', icon: Shield },
  { href: '/diagnostico', label: 'Diagnóstico', icon: Shield }
]

export function SidebarFallback() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const renderMenuItem = (item: typeof menuItems[0]) => {
    const Icon = item.icon
    const isActive = pathname.startsWith(item.href)
    
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
          isActive ? 'bg-gray-100 dark:bg-gray-800 border-r-4 border-blue-500' : ''
        }`}
      >
        <Icon className="w-5 h-5 mr-3" />
        {item.label}
      </Link>
    )
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Controle de versões
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Modo de Emergência
        </p>
      </div>
      
      <nav className="mt-6">
        {menuItems.map(renderMenuItem)}
        
        {/* Menu Admin - sempre visível em modo de emergência */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
          <div className="px-6 py-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Administração (Emergência)
            </span>
          </div>
          {adminMenuItems.map(renderMenuItem)}
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-6 py-3 mt-8 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </button>
      </nav>
    </aside>
  )
}