import { SupabaseClient } from '@supabase/supabase-js'
import { FilterState } from '@/types'
import { mapHotelToClient } from '@/lib/utils/hotel-mapping'

/**
 * Busca os IDs de conta (campo 'account_id' na tabela metricas_ads) correspondentes aos filtros de hotel, cidade e estado.
 * Centraliza a lógica para evitar problemas com colunas inconsistentes (como 'client' no Meta).
 */
export async function getMatchingClients(
  supabase: SupabaseClient,
  filters: Pick<FilterState, 'selectedHotels' | 'selectedCidades' | 'selectedEstados' | 'startDate' | 'endDate'>
): Promise<string[] | null> {
  const { selectedHotels, selectedCidades, selectedEstados, startDate, endDate } = filters

  // 1. Se houver filtros de cidade ou estado, primeiro buscamos os nomes dos hotéis correspondentes
  let hotelNamesFromGeo: string[] = []
  if (selectedCidades.length > 0 || selectedEstados.length > 0) {
    const hotelQuery = supabase
      .from('hoteis_config')
      .select('nome_hotel')
      .eq('ativo', true)
    
    if (selectedCidades.length > 0) {
      hotelQuery.in('cidade', selectedCidades)
    }
    if (selectedEstados.length > 0) {
      hotelQuery.in('estado', selectedEstados)
    }
    
    const { data: hoteisFiltrados, error: geoError } = await hotelQuery
    if (geoError) {
      console.error('[filter-helpers] Erro ao buscar hotéis por cidade/estado:', geoError)
      return []
    }
    
    hotelNamesFromGeo = hoteisFiltrados?.map((h: any) => h.nome_hotel) || []
    
    if (hotelNamesFromGeo.length === 0) {
      return []
    }
  }

  // 2. Combinar hotéis selecionados explicitamente com os filtrados por geo
  let finalHotelNames = selectedHotels.length > 0 ? selectedHotels : hotelNamesFromGeo

  // Se não houver nenhum filtro de hotel/geo, retornamos null para indicar que não deve aplicar filtro
  if (finalHotelNames.length === 0 && selectedCidades.length === 0 && selectedEstados.length === 0) {
    return null
  }

  // 3. Buscar todas as contas únicas disponíveis no período para fazer o mapeamento correto
  // Buscamos account_id, account_name e client para ter redundância no match
  const { data: uniqueAccounts, error: accountsError } = await supabase
    .from('metricas_ads')
    .select('account_id, account_name, client, platform')
    .gte('date', startDate)
    .lte('date', endDate)
    .limit(10000)
  
  if (accountsError) {
    console.error('[filter-helpers] Erro ao buscar contas únicas:', accountsError)
    return []
  }
  
  // Usar um Map para garantir unicidade por account_id e facilitar o processamento
  const accountsMap = new Map<string, { account_name: string, client: string, platform: string }>()
  uniqueAccounts?.forEach((acc: any) => {
    if (acc.account_id) {
      accountsMap.set(acc.account_id, {
        account_name: acc.account_name || '',
        client: acc.client || '',
        platform: acc.platform || ''
      })
    }
  })
  
  const matchingAccountIds = new Set<string>()
  
  // Função auxiliar para normalização robusta
  const normalize = (text: string) => 
    text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim()

  finalHotelNames.forEach(hotelName => {
    const mapped = mapHotelToClient(hotelName)
    const normalizedMapped = normalize(mapped)
    
    if (!normalizedMapped) return

    accountsMap.forEach((data, accountId) => {
      const normalizedClient = normalize(data.client)
      const normalizedAccountName = normalize(data.account_name)
      const platform = (data.platform || '').toLowerCase()
      const isMeta = platform.includes('meta')
      
      // Para Meta Ads, o client no banco de dados está inconsistente (ex: DPNY com client 'grinbergs')
      // Portanto, priorizamos o account_name para Meta Ads.
      if (isMeta) {
        if (
          normalizedAccountName === normalizedMapped ||
          normalizedAccountName.includes(normalizedMapped) ||
          normalizedMapped.includes(normalizedAccountName)
        ) {
          matchingAccountIds.add(accountId)
        }
      } else {
        // Para Google Ads e outras plataformas, o client é mais confiável
        if (
          normalizedClient === normalizedMapped ||
          normalizedClient.includes(normalizedMapped) ||
          normalizedMapped.includes(normalizedClient) ||
          normalizedAccountName === normalizedMapped ||
          normalizedAccountName.includes(normalizedMapped)
        ) {
          matchingAccountIds.add(accountId)
        }
      }
    })
  })
  
  return Array.from(matchingAccountIds)
}

/**
 * Normaliza os nomes das plataformas para garantir consistência nas queries.
 */
export function normalizePlatforms(platforms: string[]): string[] {
  const normalized = new Set<string>()
  platforms.forEach(p => {
    const upperP = p.toUpperCase()
    if (upperP === 'GOOGLE ADS' || upperP === 'GOOGLE') {
      normalized.add('Google')
      normalized.add('Google Ads')
    } else if (upperP === 'META ADS' || upperP === 'META') {
      normalized.add('Meta')
      normalized.add('Meta Ads')
    } else {
      normalized.add(p)
    }
  })
  return Array.from(normalized)
}
