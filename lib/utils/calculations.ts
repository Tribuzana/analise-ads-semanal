export const calculateROAS = (revenue: number, spend: number): number => {
  if (spend === 0) return 0
  return revenue / spend
}

export const calculateCPA = (spend: number, conversions: number): number => {
  if (conversions === 0) return 0
  return spend / conversions
}

export const calculateCTR = (clicks: number, impressions: number): number => {
  if (impressions === 0) return 0
  return (clicks / impressions) * 100
}

export const calculateCPC = (spend: number, clicks: number): number => {
  if (clicks === 0) return 0
  return spend / clicks
}

export const calculateCPM = (spend: number, impressions: number): number => {
  if (impressions === 0) return 0
  return (spend / impressions) * 1000
}

export const calculateFrequency = (impressions: number, estimatedReach: number): number => {
  if (estimatedReach === 0) return 0
  return impressions / estimatedReach
}

export const calculateDelta = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * FunÃ§Ã£o de sanity check para verificar consistÃªncia entre mÃ©tricas relatadas e recalculadas
 * Emite console.warn quando a diferenÃ§a ultrapassa 5% em agregaÃ§Ãµes com mais de uma linha
 */
export interface MetricConsistencyIssue {
  metricName: string
  reported: number
  recalculated: number
  percentDifference: number
  dataPoints: number
}

export const checkMetricConsistency = (
  reportedMetric: number,
  recalculatedMetric: number,
  metricName: string,
  dataPoints: number
): MetricConsistencyIssue | null => {
  if (dataPoints <= 1) return null // NÃ£o verificar consistÃªncia para uma Ãºnica linha

  if (recalculatedMetric === 0 && reportedMetric === 0) return null // Ambos zero, consistente

  const difference = Math.abs(reportedMetric - recalculatedMetric)
  const average = (reportedMetric + recalculatedMetric) / 2

  if (average === 0) return null // Evitar divisÃ£o por zero

  const percentDifference = (difference / average) * 100

  if (percentDifference > 5) {
    console.warn(
      `[MetricConsistency] InconsistÃªncia detectada em ${metricName}: ` +
      `relatado=${reportedMetric.toFixed(4)}, ` +
      `recalculado=${recalculatedMetric.toFixed(4)}, ` +
      `diferenÃ§a=${percentDifference.toFixed(2)}%, ` +
      `pontos de dados=${dataPoints}`
    )
    return {
      metricName,
      reported: reportedMetric,
      recalculated: recalculatedMetric,
      percentDifference,
      dataPoints,
    }
  }

  return null
}
