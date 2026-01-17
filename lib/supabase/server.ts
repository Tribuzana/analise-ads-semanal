import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export const createClient = () => {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('[Supabase Server] Variáveis de ambiente não definidas:', {
      url: url ? 'OK' : 'FALTANDO',
      key: key ? 'OK' : 'FALTANDO',
    })
    throw new Error(
      'Variáveis de ambiente do Supabase não estão configuradas. Verifique o arquivo .env.local e reinicie o servidor Next.js'
    )
  }

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Server component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Server component
          }
        },
      },
    }
  )
}
