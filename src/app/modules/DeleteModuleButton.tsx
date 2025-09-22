'use client'

import { Trash2 } from 'lucide-react'
import { createClient } from '@/src/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function DeleteModuleButton({ moduleId, moduleName }: { moduleId: string, moduleName: string }) {
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
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
  }

  return (
    <button
      onClick={handleDelete}
      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
    >
      <Trash2 className="w-4 h-4 inline" />
    </button>
  )
}