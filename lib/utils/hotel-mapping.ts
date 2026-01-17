/**
 * Normaliza o nome do hotel para fazer correspondência com o campo client da tabela metricas_ads
 */
export function normalizeHotelName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
    .trim()
}

/**
 * Mapeia o nome do hotel para o formato usado no campo client
 * Exemplos:
 * - "DPNY" -> "dpny"
 * - "Grínbergs Village Hotel" -> "grinbergs"
 */
export function mapHotelToClient(hotelName: string): string {
  const normalized = normalizeHotelName(hotelName)
  
  // Mapeamentos específicos conhecidos
  const mappings: Record<string, string> = {
    'dpny': 'dpny',
    'grinbergsvillagehotel': 'grinbergs',
    'grinbergs': 'grinbergs',
  }
  
  // Verifica se há um mapeamento específico
  if (mappings[normalized]) {
    return mappings[normalized]
  }
  
  // Tenta extrair a primeira palavra significativa
  const words = normalized.split(/\s+/).filter(w => w.length > 2)
  if (words.length > 0) {
    return words[0]
  }
  
  return normalized
}

/**
 * Verifica se um nome de hotel corresponde a um client
 */
export function hotelMatchesClient(hotelName: string, client: string): boolean {
  const mapped = mapHotelToClient(hotelName)
  const normalizedClient = normalizeHotelName(client)
  return mapped === normalizedClient || normalizedClient.includes(mapped) || mapped.includes(normalizedClient)
}
