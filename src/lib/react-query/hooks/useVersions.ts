import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Hook para buscar todas as versões
export const useVersions = () => {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['versions'],
    queryFn: async () => {
      console.log('Fetching versions from database...')
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

      console.log('Versions fetched:', data?.length || 0)
      return data || []
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
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
      console.log('🔄 MODULES: Fetching from database...', new Date().toLocaleTimeString())
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('name')

      if (error) {
        console.error('❌ MODULES: Error fetching:', error)
        throw new Error(error.message)
      }

      console.log('✅ MODULES: Fetched successfully:', data?.length || 0, 'items')
      return data || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutos (mais agressivo)
    gcTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    notifyOnChangeProps: ['data', 'error'], // Otimização extra
  })
}

// Hook para buscar todos os clientes
export const useClients = () => {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      console.log('Fetching clients from database...')
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name')

      if (error) {
        throw new Error(error.message)
      }

      console.log('Clients fetched:', data?.length || 0)
      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
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