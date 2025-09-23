import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Cache response para evitar múltiplas instâncias
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Lazy load supabase apenas quando necessário
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Otimização: reutilizar response ao invés de criar novo
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // Otimização: reutilizar response ao invés de criar novo
          const removeOptions = { name, value: '', ...options }
          request.cookies.set(removeOptions)
          response.cookies.set(removeOptions)
        },
      },
    }
  )

  // Session check otimizado - só quando necessário
  const hasAuthCookie = request.cookies.has('sb-access-token') || 
                       request.cookies.has('sb-refresh-token')
  
  if (hasAuthCookie) {
    await supabase.auth.getSession()
  }

  return response
}
