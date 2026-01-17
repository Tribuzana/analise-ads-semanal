import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// Chave para armazenar o cliente no globalThis (persiste entre HMR)
const SUPABASE_CLIENT_KEY = '__supabase_browser_client__' as const

// Tipo para globalThis com o cliente Supabase
declare global {
  var __supabase_browser_client__: SupabaseClient<Database> | undefined
}

// Lock simples baseado em Promise (evita AbortError do navigator.locks)
// Isso é seguro porque usamos singleton - não há concorrência real
const locks = new Map<string, Promise<void>>()

async function simpleLock<R>(
  name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> {
  // Aguarda lock anterior se existir
  const existingLock = locks.get(name)
  if (existingLock) {
    await existingLock
  }

  // Cria novo lock
  let resolveLock: () => void
  const lockPromise = new Promise<void>((resolve) => {
    resolveLock = resolve
  })
  locks.set(name, lockPromise)

  try {
    return await fn()
  } finally {
    resolveLock!()
    locks.delete(name)
  }
}

// Singleton com persistência em globalThis para sobreviver ao HMR do Next.js
const getOrCreateClient = (): SupabaseClient<Database> | null => {
  // Só executa no browser
  if (typeof window === 'undefined') {
    return null
  }
  
  // Se já existe um cliente global, reutiliza (sobrevive ao HMR)
  if (globalThis[SUPABASE_CLIENT_KEY]) {
    return globalThis[SUPABASE_CLIENT_KEY]
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('[Supabase Client] Variáveis de ambiente não definidas:', {
      url: url ? 'OK' : 'FALTANDO',
      key: key ? 'OK' : 'FALTANDO',
    })
    return null
  }

  // Cria cliente com lock customizado que não usa navigator.locks (evita AbortError)
  globalThis[SUPABASE_CLIENT_KEY] = createBrowserClient<Database>(url, key, {
    auth: {
      lock: simpleLock,
    },
  })
  return globalThis[SUPABASE_CLIENT_KEY]
}

// Obtém ou cria o cliente quando o módulo é carregado
const browserClient = getOrCreateClient()

export const createClient = (): SupabaseClient<Database> => {
  if (!browserClient) {
    // Fallback para SSR - cria cliente temporário (não persiste)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      throw new Error(
        'Variáveis de ambiente do Supabase não estão configuradas. Verifique o arquivo .env.local'
      )
    }
    
    return createBrowserClient<Database>(url, key, {
      auth: {
        lock: simpleLock,
      },
    })
  }

  return browserClient
}
