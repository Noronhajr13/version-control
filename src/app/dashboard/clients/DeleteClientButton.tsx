'use client'

import { Trash2 } from 'lucide-react'
import { createClient } from '@/src/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function DeleteClientButton({ clientId, clientName }: { clientId: string, clientName: string }) {
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${clientName}"?`)) {
      return
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)

    if (error) {
      toast.error('Erro ao excluir cliente')
    } else {
      toast.success('Cliente excluído com sucesso')
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