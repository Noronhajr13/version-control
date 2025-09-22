'use client'

import { createClient } from '@/src/lib/supabase/client'
import { useMemo } from 'react'

export function useSupabase() {
  const supabase = useMemo(() => createClient(), [])
  return supabase
}