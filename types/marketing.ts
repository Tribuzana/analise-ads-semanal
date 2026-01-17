export interface MarketingMetrics {
  date: string
  platform: 'Google Ads' | 'Meta Ads' | 'Google' | 'Meta'
  spend: number
  revenue: number
  conversions: number
  roas: number
  cpa: number
  ctr: number
  impressions: number
  clicks: number
}

export interface MarketingAnalytics {
  totalSpend: number
  totalRevenue: number
  totalConversions: number
  averageROAS: number
  averageCPA: number
  averageCTR: number
  metricsByPlatform: {
    google: MarketingMetrics[]
    meta: MarketingMetrics[]
  }
  metricsByDate: MarketingMetrics[]
}

export interface CampaignData {
  campaign_id: string
  campaign_name: string
  client: string
  platform: 'Google Ads' | 'Meta Ads' | 'Google' | 'Meta'
  campaign_objective: string | null
  campaign_status: string | null
  spend: number
  revenue: number
  conversions: number
  clicks: number
  impressions: number
  roas: number
  cpa: number
  cpc: number
  ctr: number
}

export interface ObjectiveAnalysis {
  objective: string
  campaigns: number
  spend: number
  revenue: number
  roas: number
  conversions: number
}

export interface TemporalData {
  date: string
  spend: number
  revenue: number
  conversions: number
  roas: number
}

export interface MarketingAnalyticsComparison {
  campaigns: CampaignData[]
  objectiveAnalysis: ObjectiveAnalysis[]
  temporalData: TemporalData[]
  topCampaigns: CampaignData[]
}

export interface MarketingAnalyticsData {
  campaigns: CampaignData[]
  objectiveAnalysis: ObjectiveAnalysis[]
  temporalData: TemporalData[]
  topCampaigns: CampaignData[]
  comparison?: MarketingAnalyticsComparison
}

export type SortField = 'campaign_name' | 'campaign_objective' | 'spend' | 'revenue' | 'roas' | 'conversions' | 'cpa' | 'clicks' | 'ctr' | 'cpc' | 'client' | 'platform'
export type SortDirection = 'asc' | 'desc'
export type CampaignStatusFilter = 'all' | 'active' | 'paused'

export interface CampaignPeriodMetrics {
  spend: number
  revenue: number
  conversions: number
  clicks: number
  impressions: number
  roas: number
  cpa: number
  cpc: number
  ctr: number
}

export interface CampaignVariation {
  spend: number
  revenue: number
  conversions: number
  cpa: number
  roas: number
}

export interface CampaignWithVariation extends CampaignData {
  variation?: CampaignVariation
}
