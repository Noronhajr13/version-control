import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/src/lib/supabase/client'

// Hook para buscar todas as versões
export const useVersions = () => {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['versions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('versions')
        .select(`
          *,
          modules (name)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
  })
}

// Hook para buscar uma versão específica
export const useVersion = (id: string) => {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['version', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('versions')
        .select(`
          *,
          modules (
            id,
            name,
            description
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    enabled: !!id, // Só executa se id existir
  })
}

// Hook para buscar todos os módulos
export const useModules = () => {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('name')

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
  })
}

// Hook para buscar todos os clientes
export const useClients = () => {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name')

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
  })
}

// Hook para criar nova versão
export const useCreateVersion = () => {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (versionData: any) => {
      const { data, error } = await supabase
        .from('versions')
        .insert(versionData)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      // Invalida e recarrega a lista de versões
      queryClient.invalidateQueries({ queryKey: ['versions'] })
    },
  })
}

// Hook para atualizar versão
export const useUpdateVersion = () => {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: result, error } = await supabase
        .from('versions')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return result
    },
    onSuccess: (data) => {
      // Invalida queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['versions'] })
      queryClient.invalidateQueries({ queryKey: ['version', data.id] })
    },
  })
}

// Hook para deletar versão
export const useDeleteVersion = () => {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('versions')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions'] })
    },
  })
}