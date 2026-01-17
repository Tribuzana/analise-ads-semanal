'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Usuario = Database['public']['Tables']['usuarios']['Row']

interface AuthContextType {
  user: User | null
  usuario: Usuario | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUsuario(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUsuario(session.user.id)
      } else {
        setUsuario(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchUsuario = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .eq('ativo', true)
        .single()

      if (error) throw error
      setUsuario(data)
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      setUsuario(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    try {
      // Limpar localStorage relacionado à autenticação
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tribuzana_filters')
        localStorage.removeItem('tribuzana_resolved_alerts')
        localStorage.removeItem('tribuzana_sidebar_collapsed')
      }

      // Fazer logout no Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('[signOut] Erro do Supabase:', error)
        // Mesmo com erro, limpar estado local
        setUser(null)
        setUsuario(null)
        throw error
      }

      // Limpar estado local
      setUser(null)
      setUsuario(null)
    } catch (error) {
      console.error('[signOut] Erro ao fazer logout:', error)
      // Sempre limpar estado local mesmo em caso de erro
      setUser(null)
      setUsuario(null)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, usuario, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
