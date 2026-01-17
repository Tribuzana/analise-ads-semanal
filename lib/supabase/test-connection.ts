'use server'

import { createClient } from './server'

export async function testConnection() {
  try {
    const supabase = createClient()
    
    // Testar conexão básica
    const { data, error } = await supabase
      .from('hoteis_config')
      .select('id, nome_hotel')
      .limit(1)
    
    if (error) {
      return {
        success: false,
        error: error.message,
        details: error,
      }
    }
    
    return {
      success: true,
      message: 'Conexão com Supabase estabelecida com sucesso!',
      data: data,
      env: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Definida' : 'NÃO DEFINIDA',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Definida' : 'NÃO DEFINIDA',
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      stack: error.stack,
      env: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Definida' : 'NÃO DEFINIDA',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Definida' : 'NÃO DEFINIDA',
      },
    }
  }
}
