import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, format, subYears, differenceInDays } from 'date-fns'

/**
 * Converte string 'YYYY-MM-DD' para objeto Date de forma segura (ignorando timezone)
 */
const parseDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const getDefaultDateRange = () => {
  const today = new Date()
  const yesterday = subDays(today, 1)
  const sevenDaysAgo = subDays(yesterday, 6)
  
  return {
    startDate: format(sevenDaysAgo, 'yyyy-MM-dd'),
    endDate: format(yesterday, 'yyyy-MM-dd')
  }
}

export const getLastWeek = () => {
  const today = new Date()
  // Calcular a semana passada: pegar o domingo da semana passada até o sábado
  // Se hoje é domingo, semana passada é há 7 dias
  // Caso contrário, calcular o domingo da semana passada
  const lastWeekStart = startOfWeek(subDays(today, 7), { weekStartsOn: 0 })
  const lastWeekEnd = endOfWeek(subDays(today, 7), { weekStartsOn: 0 })
  
  return {
    startDate: format(lastWeekStart, 'yyyy-MM-dd'),
    endDate: format(lastWeekEnd, 'yyyy-MM-dd')
  }
}

/**
 * Calcula o período das últimas 4 semanas completas (domingo a sábado)
 * Retorna o domingo da 4ª semana passada até o sábado da semana passada
 */
export const getLast4Weeks = () => {
  const today = new Date()
  // Calcular o último sábado (fim da semana passada)
  const lastSaturday = endOfWeek(subDays(today, 7), { weekStartsOn: 0 })
  // Retroceder 4 semanas completas (28 dias) a partir do último sábado
  const fourWeeksAgoSunday = startOfWeek(subDays(lastSaturday, 27), { weekStartsOn: 0 })
  
  return {
    startDate: format(fourWeeksAgoSunday, 'yyyy-MM-dd'),
    endDate: format(lastSaturday, 'yyyy-MM-dd')
  }
}

export const getThisMonth = () => {
  const today = new Date()
  const yesterday = subDays(today, 1)
  const firstDayOfMonth = startOfMonth(today)
  
  return {
    startDate: format(firstDayOfMonth, 'yyyy-MM-dd'),
    endDate: format(yesterday, 'yyyy-MM-dd')
  }
}

export const getLastMonth = () => {
  const lastMonth = subMonths(new Date(), 1)
  const firstDay = startOfMonth(lastMonth)
  const lastDay = endOfMonth(lastMonth)
  
  return {
    startDate: format(firstDay, 'yyyy-MM-dd'),
    endDate: format(lastDay, 'yyyy-MM-dd')
  }
}

export const getYearAgoRange = (startDate: string, endDate: string) => {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  
  const yearAgoStart = subYears(start, 1)
  const yearAgoEnd = subYears(end, 1)
  
  return {
    startDate: format(yearAgoStart, 'yyyy-MM-dd'),
    endDate: format(yearAgoEnd, 'yyyy-MM-dd')
  }
}

/**
 * Calcula o período anterior equivalente baseado na duração do período selecionado
 * Exemplo: Se o período é de 7 dias (01/01 a 07/01), retorna os 7 dias anteriores (25/12 a 31/12)
 */
export const getPreviousPeriodRange = (startDate: string, endDate: string) => {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  
  // Calcular a duração do período em dias
  const diffDays = differenceInDays(end, start) + 1
  
  // Calcular o período anterior subtraindo a duração do final
  const previousEnd = subDays(start, 1) // Um dia antes do início do período atual
  const previousStart = subDays(previousEnd, diffDays - 1) // Subtrair a duração
  
  return {
    startDate: format(previousStart, 'yyyy-MM-dd'),
    endDate: format(previousEnd, 'yyyy-MM-dd')
  }
}
