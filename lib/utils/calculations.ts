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

export const calculateDelta = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}
