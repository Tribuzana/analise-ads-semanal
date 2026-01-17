'use server'

import { createClient } from '@/lib/supabase/server'
import type { FilterState } from '@/types'
import type { Alert } from '@/types/alertas'
import { subDays, format, differenceInDays } from 'date-fns'
import { calculateROAS, calculateCPA, calculateCTR, calculateDelta } from '@/lib/utils/calculations'

export async function generateAlerts(filters: FilterState): Promise<Alert[]> {
  const supabase = createClient()
  const alerts: Alert[] = []

  try {
    // Validar datas
    if (!filters.startDate || !filters.endDate) {
      console.warn('[generateAlerts] Datas não definidas')
      return []
    }

    // Buscar dados do período atual
    let currentQuery = supabase
      .from('metricas_ads')
      .select('*')
      .gte('date', filters.startDate)
      .lte('date', filters.endDate)

    // Filtrar por hotéis se selecionados
    if (filters.selectedHotels.length > 0) {
      // Buscar clientes correspondentes
      const { data: uniqueClients } = await supabase
        .from('metricas_ads')
        .select('client')
        .gte('date', filters.startDate)
        .lte('date', filters.endDate)
      
      const matchingClients = new Set<string>()
      const clientSet = new Set(uniqueClients?.map(c => c.client).filter(Boolean) || [])
      
      filters.selectedHotels.forEach(hotelName => {
        const normalized = hotelName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        clientSet.forEach(client => {
          if (client) {
            const normalizedClient = client.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            if (
              normalizedClient === normalized ||
              normalizedClient.includes(normalized) ||
              normalized.includes(normalizedClient)
            ) {
              matchingClients.add(client)
            }
          }
        })
      })
      
      if (matchingClients.size > 0) {
        currentQuery = currentQuery.in('client', Array.from(matchingClients))
      }
    }

    const { data: currentData, error: currentError } = await currentQuery

    if (currentError) {
      console.error('[generateAlerts] Erro ao buscar dados atuais:', currentError)
      throw currentError
    }

    // Buscar dados da semana anterior para comparação
    const prevStart = format(subDays(new Date(filters.startDate), 7), 'yyyy-MM-dd')
    const prevEnd = format(subDays(new Date(filters.endDate), 7), 'yyyy-MM-dd')

    let previousQuery = supabase
      .from('metricas_ads')
      .select('*')
      .gte('date', prevStart)
      .lte('date', prevEnd)

    if (filters.selectedHotels.length > 0) {
      const { data: prevClients } = await supabase
        .from('metricas_ads')
        .select('client')
        .gte('date', prevStart)
        .lte('date', prevEnd)
      
      const matchingClients = new Set<string>()
      const clientSet = new Set(prevClients?.map(c => c.client).filter(Boolean) || [])
      
      filters.selectedHotels.forEach(hotelName => {
        const normalized = hotelName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        clientSet.forEach(client => {
          if (client) {
            const normalizedClient = client.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            if (
              normalizedClient === normalized ||
              normalizedClient.includes(normalized) ||
              normalized.includes(normalizedClient)
            ) {
              matchingClients.add(client)
            }
          }
        })
      })
      
      if (matchingClients.size > 0) {
        previousQuery = previousQuery.in('client', Array.from(matchingClients))
      }
    }

    const { data: previousData, error: previousError } = await previousQuery

    if (previousError) {
      console.error('[generateAlerts] Erro ao buscar dados anteriores:', previousError)
      // Continuar sem dados anteriores
    }

    // Buscar configurações de alertas
    const configs = await getAlertConfigs(filters.selectedHotels)

    // Processar por campanha
    const campaignMap = groupByCampaign(currentData || [])
    const previousCampaignMap = groupByCampaign(previousData || [])

    for (const [key, campaign] of campaignMap.entries()) {
      const config = configs.find(c => c.nomeHotel === campaign.client)
      const previousCampaign = previousCampaignMap.get(key)

      // 1. Baixa Performance
      const lowPerfAlert = checkLowPerformance(campaign, config)
      if (lowPerfAlert) alerts.push(lowPerfAlert)

      // 2. Saldo Baixo
      const lowBudgetAlert = checkLowBudget(campaign)
      if (lowBudgetAlert) alerts.push(lowBudgetAlert)

      // 3. Sem Gasto
      const noSpendAlert = checkNoSpend(campaign)
      if (noSpendAlert) alerts.push(noSpendAlert)

      // 4. Próxima de Finalizar
      const endingSoonAlert = checkEndingSoon(campaign)
      if (endingSoonAlert) alerts.push(endingSoonAlert)

      // 5. Orçamento Diário Esgotado
      const budgetExhaustedAlert = checkBudgetExhausted(campaign)
      if (budgetExhaustedAlert) alerts.push(budgetExhaustedAlert)

      // 6. Queda de Impressões
      if (previousCampaign) {
        const impressionDropAlert = checkImpressionDrop(campaign, previousCampaign)
        if (impressionDropAlert) alerts.push(impressionDropAlert)
      }

      // 7. Aumento de CPC
      const cpcSpikeAlert = checkCPCSpike(campaign)
      if (cpcSpikeAlert) alerts.push(cpcSpikeAlert)

      // 8. Pausada com Potencial
      const pausedPotentialAlert = checkPausedPotential(campaign)
      if (pausedPotentialAlert) alerts.push(pausedPotentialAlert)

      // 9. Oportunidade de Escala
      const scaleOpportunityAlert = checkScaleOpportunity(campaign)
      if (scaleOpportunityAlert) alerts.push(scaleOpportunityAlert)

      // 10. Impressões Perdidas por Budget
      const impressionShareLostAlert = checkImpressionShareLost(campaign)
      if (impressionShareLostAlert) alerts.push(impressionShareLostAlert)
    }

    console.log(`[generateAlerts] Gerados ${alerts.length} alertas`)
    return alerts
  } catch (error) {
    console.error('[generateAlerts] Erro ao gerar alertas:', error)
    return []
  }
}

function groupByCampaign(data: any[]): Map<string, any> {
  const map = new Map()

  data.forEach(row => {
    const key = `${row.campaign_id}_${row.platform}`
    if (!map.has(key)) {
      map.set(key, {
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name,
        client: row.client,
        platform: row.platform === 'Google' ? 'Google Ads' : row.platform === 'Meta' ? 'Meta Ads' : row.platform,
        campaign_status: row.campaign_status,
        campaign_end_date: row.campaign_end_date,
        spend: 0,
        revenue: 0,
        conversions: 0,
        clicks: 0,
        impressions: 0,
        daily_budget: row.min_daily_budget,
        search_budget_lost_impression_share: row.search_budget_lost_impression_share,
        dates: [],
      })
    }

    const campaign = map.get(key)
    campaign.spend += parseFloat(String(row.spend || 0))
    campaign.revenue += parseFloat(String(row.conversions_value || 0))
    campaign.conversions += parseInt(String(row.conversions || 0), 10)
    campaign.clicks += parseInt(String(row.clicks || 0), 10)
    campaign.impressions += parseInt(String(row.impressions || 0), 10)
    campaign.dates.push(row.date)
  })

  return map
}

function checkLowPerformance(campaign: any, config?: any): Alert | null {
  const roas = calculateROAS(campaign.revenue, campaign.spend)
  const cpa = calculateCPA(campaign.spend, campaign.conversions)
  const ctr = calculateCTR(campaign.clicks, campaign.impressions)

  const roasMin = config?.rules?.roasMin || 2.0
  const cpaMax = config?.rules?.cpaMax || 500
  const ctrMin = config?.rules?.ctrMin || 1.0

  if (campaign.spend > 0 && (roas < roasMin || cpa > cpaMax || ctr < ctrMin)) {
    return {
      id: `low_perf_${campaign.campaign_id}_${campaign.platform}`,
      type: 'low_performance',
      severity: 'critical',
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name || 'Sem nome',
      client: campaign.client,
      platform: campaign.platform,
      message: `Baixa performance: ROAS ${roas.toFixed(2)} (mín: ${roasMin}), CPA R$ ${cpa.toFixed(2)} (máx: ${cpaMax}), CTR ${ctr.toFixed(2)}% (mín: ${ctrMin}%)`,
      metrics: { roas, cpa, ctr, spend: campaign.spend, revenue: campaign.revenue },
      actions: [
        'Revisar segmentação de público',
        'Ajustar lances e budget',
        'Otimizar criativos e copy',
        'Considerar pausar campanha',
      ],
      created_at: new Date().toISOString(),
      resolved: false,
    }
  }

  return null
}

function checkLowBudget(campaign: any): Alert | null {
  if (!campaign.daily_budget || campaign.daily_budget === 0) return null

  const budgetUsage = (campaign.spend / campaign.daily_budget) * 100

  if (budgetUsage >= 80 && budgetUsage < 100) {
    return {
      id: `low_budget_${campaign.campaign_id}_${campaign.platform}`,
      type: 'low_budget',
      severity: 'warning',
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name || 'Sem nome',
      client: campaign.client,
      platform: campaign.platform,
      message: `Saldo baixo: ${budgetUsage.toFixed(0)}% do orçamento diário utilizado`,
      metrics: { 
        spend: campaign.spend, 
        daily_budget: campaign.daily_budget,
        budgetUsage 
      },
      actions: [
        'Aumentar orçamento diário',
        'Revisar estratégia de lances',
        'Monitorar performance próximas horas',
      ],
      created_at: new Date().toISOString(),
      resolved: false,
    }
  }

  return null
}

function checkNoSpend(campaign: any): Alert | null {
  const status = campaign.campaign_status?.toUpperCase()
  
  if ((status === 'ACTIVE' || status === 'ENABLED' || !status) && campaign.spend === 0 && campaign.dates.length >= 2) {
    return {
      id: `no_spend_${campaign.campaign_id}_${campaign.platform}`,
      type: 'no_spend',
      severity: 'critical',
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name || 'Sem nome',
      client: campaign.client,
      platform: campaign.platform,
      message: `Campanha ativa sem gasto há ${campaign.dates.length} dias`,
      metrics: { spend: campaign.spend, days: campaign.dates.length },
      actions: [
        'Verificar aprovação de anúncios',
        'Revisar segmentação e lances',
        'Verificar orçamento da conta',
        'Conferir método de pagamento',
      ],
      created_at: new Date().toISOString(),
      resolved: false,
    }
  }

  return null
}

function checkEndingSoon(campaign: any): Alert | null {
  if (!campaign.campaign_end_date) return null

  try {
    const endDate = new Date(campaign.campaign_end_date)
    const daysUntilEnd = differenceInDays(endDate, new Date())

    if (daysUntilEnd >= 0 && daysUntilEnd <= 3) {
      return {
        id: `ending_soon_${campaign.campaign_id}_${campaign.platform}`,
        type: 'ending_soon',
        severity: 'warning',
        campaign_id: campaign.campaign_id,
        campaign_name: campaign.campaign_name || 'Sem nome',
        client: campaign.client,
        platform: campaign.platform,
        message: `Campanha finaliza em ${daysUntilEnd} dia(s)`,
        metrics: { 
          end_date: campaign.campaign_end_date,
          days_remaining: daysUntilEnd 
        },
        actions: [
          'Estender data de término',
          'Criar nova campanha similar',
          'Avaliar resultados antes de finalizar',
        ],
        created_at: new Date().toISOString(),
        resolved: false,
      }
    }
  } catch {
    // Data inválida, ignorar
  }

  return null
}

function checkBudgetExhausted(campaign: any): Alert | null {
  if (!campaign.daily_budget || campaign.daily_budget === 0) return null

  const hour = new Date().getHours()
  
  if (campaign.spend >= campaign.daily_budget * 0.95 && hour < 18) {
    return {
      id: `budget_exhausted_${campaign.campaign_id}_${campaign.platform}`,
      type: 'budget_exhausted',
      severity: 'warning',
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name || 'Sem nome',
      client: campaign.client,
      platform: campaign.platform,
      message: `Orçamento diário esgotado antes das 18h`,
      metrics: { 
        spend: campaign.spend,
        daily_budget: campaign.daily_budget,
        hour 
      },
      actions: [
        'Aumentar orçamento diário',
        'Otimizar estratégia de lances',
        'Distribuir budget ao longo do dia',
      ],
      created_at: new Date().toISOString(),
      resolved: false,
    }
  }

  return null
}

function checkImpressionDrop(current: any, previous: any): Alert | null {
  const drop = calculateDelta(current.impressions, previous.impressions)

  if (drop < -50 && current.impressions > 0) {
    return {
      id: `impression_drop_${current.campaign_id}_${current.platform}`,
      type: 'impression_drop',
      severity: 'critical',
      campaign_id: current.campaign_id,
      campaign_name: current.campaign_name || 'Sem nome',
      client: current.client,
      platform: current.platform,
      message: `Queda de ${Math.abs(drop).toFixed(0)}% nas impressões vs semana anterior`,
      metrics: {
        current_impressions: current.impressions,
        previous_impressions: previous.impressions,
        drop_percentage: drop,
      },
      actions: [
        'Verificar aprovação de anúncios',
        'Aumentar lances ou orçamento',
        'Revisar segmentação',
        'Analisar concorrência',
      ],
      created_at: new Date().toISOString(),
      resolved: false,
    }
  }

  return null
}

function checkCPCSpike(campaign: any): Alert | null {
  // Implementação simplificada - em produção, buscar média histórica de 30 dias
  const avgCPC = 5.0 // Placeholder
  const currentCPC = campaign.clicks > 0 ? campaign.spend / campaign.clicks : 0

  if (currentCPC > avgCPC * 1.3 && campaign.clicks > 10) {
    return {
      id: `cpc_spike_${campaign.campaign_id}_${campaign.platform}`,
      type: 'cpc_spike',
      severity: 'warning',
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name || 'Sem nome',
      client: campaign.client,
      platform: campaign.platform,
      message: `CPC aumentou ${((currentCPC / avgCPC - 1) * 100).toFixed(0)}% acima da média`,
      metrics: {
        current_cpc: currentCPC,
        average_cpc: avgCPC,
        increase_percentage: ((currentCPC / avgCPC - 1) * 100),
      },
      actions: [
        'Otimizar estratégia de lances',
        'Melhorar Quality Score',
        'Revisar palavras-chave',
        'Ajustar segmentação',
      ],
      created_at: new Date().toISOString(),
      resolved: false,
    }
  }

  return null
}

function checkPausedPotential(campaign: any): Alert | null {
  const status = campaign.campaign_status?.toUpperCase()
  const roas = calculateROAS(campaign.revenue, campaign.spend)

  if ((status === 'PAUSED' || status === 'PAUSED_BY_USER') && roas > 3.0 && campaign.spend > 0) {
    return {
      id: `paused_potential_${campaign.campaign_id}_${campaign.platform}`,
      type: 'paused_potential',
      severity: 'info',
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name || 'Sem nome',
      client: campaign.client,
      platform: campaign.platform,
      message: `Campanha pausada com ROAS histórico de ${roas.toFixed(2)}`,
      metrics: { roas, spend: campaign.spend, revenue: campaign.revenue },
      actions: [
        'Reativar campanha',
        'Analisar motivo da pausa',
        'Considerar duplicar com ajustes',
      ],
      created_at: new Date().toISOString(),
      resolved: false,
    }
  }

  return null
}

function checkScaleOpportunity(campaign: any): Alert | null {
  if (!campaign.daily_budget || campaign.daily_budget === 0) return null

  const roas = calculateROAS(campaign.revenue, campaign.spend)
  const budgetUsage = (campaign.spend / campaign.daily_budget) * 100

  if (roas > 4.0 && budgetUsage < 50 && campaign.spend > 0) {
    return {
      id: `scale_opportunity_${campaign.campaign_id}_${campaign.platform}`,
      type: 'scale_opportunity',
      severity: 'info',
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name || 'Sem nome',
      client: campaign.client,
      platform: campaign.platform,
      message: `ROAS ${roas.toFixed(2)} com apenas ${budgetUsage.toFixed(0)}% do budget utilizado`,
      metrics: {
        roas,
        spend: campaign.spend,
        daily_budget: campaign.daily_budget,
        budget_usage: budgetUsage,
      },
      actions: [
        'Aumentar orçamento gradualmente',
        'Expandir segmentação',
        'Duplicar campanha',
        'Criar campanha lookalike',
      ],
      created_at: new Date().toISOString(),
      resolved: false,
    }
  }

  return null
}

function checkImpressionShareLost(campaign: any): Alert | null {
  const lostShare = campaign.search_budget_lost_impression_share

  if (lostShare && lostShare > 30) {
    return {
      id: `impression_share_lost_${campaign.campaign_id}_${campaign.platform}`,
      type: 'impression_share_lost',
      severity: 'warning',
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name || 'Sem nome',
      client: campaign.client,
      platform: campaign.platform,
      message: `${lostShare.toFixed(0)}% de impressões perdidas por budget limitado`,
      metrics: { lost_impression_share: lostShare },
      actions: [
        'Aumentar orçamento da campanha',
        'Otimizar lances',
        'Melhorar Quality Score',
      ],
      created_at: new Date().toISOString(),
      resolved: false,
    }
  }

  return null
}

async function getAlertConfigs(hotels: string[]): Promise<any[]> {
  // Buscar configurações do banco de dados
  const supabase = createClient()
  
  try {
    let query = supabase
      .from('hoteis_config')
      .select('id, nome_hotel, alerta_ativo, alerta_threshold')
      .eq('ativo', true)
    
    // Filtrar por hotéis se especificado
    if (hotels.length > 0) {
      query = query.in('nome_hotel', hotels)
    }
    
    const { data: hoteis, error } = await query
    
    if (error) {
      console.error('[getAlertConfigs] Erro do Supabase:', error)
      return []
    }
    
    if (!hoteis) return []
    
    return hoteis.map(h => ({
      hotelId: h.id,
      nomeHotel: h.nome_hotel,
      rules: {
        roasMin: 2.0,
        cpaMax: 500,
        ctrMin: 1.0,
      },
      webhookUrl: null,
      webhookSecret: null,
      webhookActive: h.alerta_ativo || false,
    }))
  } catch (error) {
    console.error('[getAlertConfigs] Erro:', error)
    return []
  }
}
