import { SupabaseClient } from '@supabase/supabase-js'
import { FilterState } from '@/types'
import { mapHotelToClient } from '@/lib/utils/hotel-mapping'

/**
 * Resultado da busca de clientes correspondentes
 */
export interface MatchingClientsResult {
  accountIds: string[] | null;
  clientCodes: string[] | null;
}

/**
 * Busca os IDs de conta (campo 'account_id' na tabela metricas_ads) e códigos de cliente
 * correspondentes aos filtros de hotel, cidade e estado.
 * Centraliza a lógica para evitar problemas com colunas inconsistentes.
 */
export async function getMatchingClients(
  supabase: SupabaseClient,
  filters: Pick<FilterState, 'selectedHotels' | 'selectedCidades' | 'selectedEstados' | 'startDate' | 'endDate'>
): Promise<MatchingClientsResult> {
  const { selectedHotels, selectedCidades, selectedEstados, startDate, endDate } = filters

  console.log('[filter-helpers] Filtros recebidos:', {
    selectedHotels: selectedHotels.length,
    selectedCidades: selectedCidades.length,
    selectedEstados: selectedEstados.length,
    startDate,
    endDate
  })

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
      return { accountIds: [], clientCodes: [] }
    }
    
    hotelNamesFromGeo = hoteisFiltrados?.map((h: any) => h.nome_hotel) || []
    
    if (hotelNamesFromGeo.length === 0) {
      return { accountIds: [], clientCodes: [] }
    }
  }

  // 2. Combinar hotéis selecionados explicitamente com os filtrados por geo
  let finalHotelNames = selectedHotels.length > 0 ? selectedHotels : hotelNamesFromGeo

  // Se não houver nenhum filtro de hotel/geo, retornamos null para indicar que não deve aplicar filtro
  if (finalHotelNames.length === 0 && selectedCidades.length === 0 && selectedEstados.length === 0) {
    return { accountIds: null, clientCodes: null }
  }

  // 3. Buscar todas as contas únicas disponíveis no período para fazer o mapeamento correto
  const { data: uniqueAccounts, error: accountsError } = await supabase
    .from('metricas_ads')
    .select('account_id, account_name, client, platform')
    .gte('date', startDate)
    .lte('date', endDate)
    .limit(10000)
  
  if (accountsError) {
    console.error('[filter-helpers] Erro ao buscar contas únicas:', accountsError)
    return { accountIds: [], clientCodes: [] }
  }
  
  const accountsMap = new Map<string, { account_name: string, client: string, platform: string }>()
  uniqueAccounts?.forEach((acc: any) => {
    if (acc.account_id) {
      const accountData = {
        account_name: (acc.account_name || '').toString().trim(),
        client: (acc.client || '').toString().trim(),
        platform: (acc.platform || '').toString().trim()
      }
      accountsMap.set(acc.account_id, accountData)
    }
  })

  const matchingAccountIds = new Set<string>()
  const matchingClientCodes = new Set<string>()

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
    
    // Sempre adicionar o código mapeado diretamente
    matchingClientCodes.add(mapped)

    accountsMap.forEach((data, accountId) => {
      const normalizedClient = normalize(data.client)
      const normalizedAccountName = normalize(data.account_name)

      let accountMatches = false

      if (normalizedClient && (
          normalizedClient === normalizedMapped ||
          normalizedClient.includes(normalizedMapped) ||
          normalizedMapped.includes(normalizedClient))) {
        accountMatches = true
      }

      if (!accountMatches && normalizedAccountName && (
          normalizedAccountName === normalizedMapped ||
          normalizedAccountName.includes(normalizedMapped) ||
          normalizedMapped.includes(normalizedAccountName))) {
        accountMatches = true
      }

      if (accountMatches) {
        matchingAccountIds.add(accountId)
        if (data.client) matchingClientCodes.add(data.client)
      }
    })
  })

  return {
    accountIds: Array.from(matchingAccountIds),
    clientCodes: Array.from(matchingClientCodes)
  }
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
