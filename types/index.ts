export * from './database'
export * from './dashboard'
export * from './marketing'
export * from './alertas'

export interface FilterState {
  selectedHotels: string[]
  startDate: string
  endDate: string
  selectedCidades: string[]
  selectedEstados: string[]
  compareYearAgo: boolean
  selectedObjectives: string[]
  selectedResultTypes: string[]
}

export interface Hotel {
  id: number
  nome_hotel: string
  nome_fantasia: string | null
  cidade: string | null
  estado: string | null
  ativo: boolean
}
