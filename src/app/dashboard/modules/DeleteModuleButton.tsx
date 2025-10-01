'use client''use client'



import { Trash2 } from 'lucide-react'import { Trash2 } from 'lucide-react'

import { createClient } from '@/src/lib/supabase/client'import { createClient } from '@/src/lib/supabase/client'

import { useRouter } from 'next/navigation'import { useRouter } from 'next/navigation'

import { toast } from 'sonner'import { toast } from 'sonner'

import { CanDelete } from '@/src/components/auth/ProtectedComponent'import { DeleteAccess, useProtectedAction } from '@/src/components/auth/ProtectedComponent'

import { useBasicPermissions } from '@/src/contexts/AuthContextBasic'

export function DeleteModuleButton({ moduleId, moduleName }: { moduleId: string, moduleName: string }) {

export function DeleteModuleButton({ moduleId, moduleName }: { moduleId: string, moduleName: string }) {  const router = useRouter()

  const router = useRouter()  const supabase = createClient()

  const supabase = createClient()  const { executeProtectedAction, canDelete } = useProtectedAction()

  const { canDelete } = useBasicPermissions()

  const handleDelete = async () => {

  const handleDelete = async () => {    if (!canDelete) {

    if (!canDelete()) {      toast.error('Sem permissão para deletar módulos')

      toast.error('Sem permissão para deletar módulos')      return

      return    }

    }

    if (!confirm(`Tem certeza que deseja deletar o módulo "${moduleName}"?`)) {

    if (!confirm(`Tem certeza que deseja deletar o módulo "${moduleName}"?`)) {      return

      return    }

    }

    try {

    try {      await executeProtectedAction(async () => {

      const { error } = await supabase    async () => {

        .from('modules')      if (!confirm(`Tem certeza que deseja excluir o módulo "${moduleName}"?`)) {

        .delete()        return

        .eq('id', moduleId)      }

      

      if (error) {      const { error } = await supabase

        toast.error('Erro ao deletar módulo')        .from('modules')

        return        .delete()

      }        .eq('id', moduleId)

      

      toast.success('Módulo deletado com sucesso')      if (error) {

      router.refresh()        toast.error('Erro ao excluir módulo')

    } catch (error) {      } else {

      toast.error('Erro ao deletar módulo')        toast.success('Módulo excluído com sucesso')

    }        router.refresh()

  }      }

    },

  return (    () => toast.error('Você não tem permissão para excluir módulos')

    <CanDelete fallback={null}>  )

      <button

        onClick={handleDelete}  return (

        className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"    <DeleteAccess resource={RESOURCES.MODULES}>

        title="Deletar módulo"      <button

      >        onClick={handleDelete}

        <Trash2 className="w-4 h-4" />        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"

      </button>        title="Excluir módulo"

    </CanDelete>      >

  )        <Trash2 className="w-4 h-4 inline" />

}      </button>
    </DeleteAccess>
  )
}