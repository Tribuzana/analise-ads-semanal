'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Hotel } from '@/types'

export function useHoteis() {
  const [hoteis, setHoteis] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    
    async function fetchHoteis() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('hoteis_config')
          .select('id, nome_hotel, nome_fantasia, cidade, estado, ativo')
          .eq('ativo', true)
          .order('nome_hotel')

        if (error) {
          console.error('[useHoteis] Erro do Supabase:', error)
          throw error
        }
        
        setHoteis(data || [])
        setError(null)
      } catch (err: any) {
        const errorMessage = err?.message || 'Erro desconhecido ao buscar hotéis'
        setError(errorMessage)
        console.error('[useHoteis] Erro ao buscar hotéis:', {
          message: errorMessage,
          error: err,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchHoteis()
  }, [])

  return { hoteis, loading, error }
}
