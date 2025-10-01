'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  GitBranch, 
  BarChart3, 
  UserCheck,
  Settings
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContextBasic'

interface MenuItem {
  name: string
  href: string
  icon: React.ElementType
  menuKey: 'dashboard' | 'modules' | 'clients' | 'versions' | 'reports' | 'users'
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    menuKey: 'dashboard'
  },
  {
    name: 'Módulos',
    href: '/dashboard/modules',
    icon: Package,
    menuKey: 'modules'
  },
  {
    name: 'Clientes',
    href: '/dashboard/clients',
    icon: Users,
    menuKey: 'clients'
  },
  {
    name: 'Versões',
    href: '/dashboard/versions',
    icon: GitBranch,
    menuKey: 'versions'
  },
  {
    name: 'Relatórios',
    href: '/dashboard/reports',
    icon: BarChart3,
    menuKey: 'reports'
  },
  {
    name: 'Usuários',
    href: '/dashboard/users',
    icon: UserCheck,
    menuKey: 'users'
  }
]

export default function SimpleSidebar({ className = '' }: { className?: string }) {
  const pathname = usePathname()
  const { canSeeMenu, role } = useAuth()

  // Filtrar menus baseado nas permissões
  const visibleMenus = menuItems.filter(item => canSeeMenu(item.menuKey))

  return (
    <div className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Controle de Versões
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {role && `Modo ${role}`}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {visibleMenus.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Admin Menu Config (apenas para admin) */}
        {role === 'admin' && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/admin/menu-config"
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings className="w-5 h-5 mr-3" />
              Configurar Menus
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}