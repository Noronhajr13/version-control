'use client'

import { Trash2 } from 'lucide-react'
import { createClient } from '@/src/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DeleteAccess, useProtectedAction } from '@/src/components/auth/ProtectedComponent'
import { RESOURCES, ACTIONS } from '@/src/hooks/usePermissions'

export function DeleteModuleButton({ moduleId, moduleName }: { moduleId: string, moduleName: string }) {
  const router = useRouter()
  const supabase = createClient()
  const { withPermissionCheck } = useProtectedAction()

  const handleDelete = withPermissionCheck(
    RESOURCES.MODULES,
    ACTIONS.DELETE,
    async () => {
      if (!confirm(`Tem certeza que deseja excluir o módulo "${moduleName}"?`)) {
        return
      }

      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId)

      if (error) {
        toast.error('Erro ao excluir módulo')
      } else {
        toast.success('Módulo excluído com sucesso')
        router.refresh()
      }
    },
    () => toast.error('Você não tem permissão para excluir módulos')
  )

  return (
    <DeleteAccess resource={RESOURCES.MODULES}>
      <button
        onClick={handleDelete}
        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
        title="Excluir módulo"
      >
        <Trash2 className="w-4 h-4 inline" />
      </button>
    </DeleteAccess>
  )
}