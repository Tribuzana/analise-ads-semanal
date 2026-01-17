'use server'

import { createClient } from '@/lib/supabase/server'
import { getMatchingClients } from '@/lib/supabase/filter-helpers'
import type { FilterState } from '@/types'
import type { Alert } from '@/types/alertas'
import { subDays, format, differenceInDays } from 'date-fns'
import { getPreviousPeriodRange, getYearAgoRange } from '@/lib/utils/date-helpers'
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

    // 1. Buscar IDs de conta correspondentes usando o helper centralizado
    const matchingAccountIds = await getMatchingClients(supabase, filters)

    // Se filtrou mas não achou nenhuma conta, retorna vazio
    if (matchingAccountIds !== null && matchingAccountIds.length === 0) {
      console.warn('[generateAlerts] Nenhum ID de conta correspondente encontrado')
      return []
    }

    // 2. Buscar dados do período atual
    let currentQuery = supabase
      .from('metricas_ads')
      .select('*')
      .gte('date', filters.startDate)
      .lte('date', filters.endDate)
      .limit(10000)

    if (matchingAccountIds !== null) {
      currentQuery = currentQuery.in('account_id', matchingAccountIds)
    }

    const { data: currentData, error: currentError } = await currentQuery

    if (currentError) {
      console.error('[generateAlerts] Erro ao buscar dados atuais:', currentError)
      throw currentError
    }

    // 3. Buscar dados do período anterior para comparação
    const previousRange = filters.compareYearAgo
      ? getYearAgoRange(filters.startDate, filters.endDate)
      : getPreviousPeriodRange(filters.startDate, filters.endDate)
    
    const prevMatchingAccountIds = await getMatchingClients(supabase, {
      startDate: previousRange.startDate,
      endDate: previousRange.endDate,
      selectedHotels: filters.selectedHotels,
      selectedCidades: filters.selectedCidades,
      selectedEstados: filters.selectedEstados,
    })

    let previousQuery = supabase
      .from('metricas_ads')
      .select('*')
      .gte('date', previousRange.startDate)
      .lte('date', previousRange.endDate)
      .limit(10000)

    if (prevMatchingAccountIds !== null) {
      if (prevMatchingAccountIds.length > 0) {
        previousQuery = previousQuery.in('account_id', prevMatchingAccountIds)
      } else {
        // Se filtrou mas não achou nada no período anterior, previousData será vazio
        previousQuery = null as any
      }
    }

    const { data: previousData, error: previousError } = previousQuery 
      ? await previousQuery 
      : { data: [], error: null }

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

    // 11. Projeção de Saldo da Conta (7 dias)
    const accountAlerts = checkAccountBalances(campaignMap)
    alerts.push(...accountAlerts)

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
    
    // Tenta resolver o nome do hotel de forma mais precisa
    let resolvedClient = row.client
    const accountName = row.account_name || ''
    
    if (accountName.toUpperCase().includes('DPNY')) {
      resolvedClient = 'DPNY'
    } else if (accountName.toUpperCase().includes('GRINBERGS') || accountName.toUpperCase().includes('GRÍNBERGS')) {
      resolvedClient = 'Grínbergs'
    } else if (resolvedClient === 'grinbergs') {
      // Se o client é 'grinbergs' mas não tem no nome da conta, mantém grinbergs ou tenta capitalizar
      resolvedClient = 'Grínbergs'
    } else {
      // Capitaliza a primeira letra para exibição
      resolvedClient = resolvedClient.charAt(0).toUpperCase() + resolvedClient.slice(1)
    }

    if (!map.has(key)) {
      map.set(key, {
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name,
        client: resolvedClient,
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
        latest_day_spend: 0,
        latest_date: '',
        // Dados da conta para projeção de saldo
        account_id: row.account_id,
        account_name: row.account_name,
        account_spend_cap: row.account_level_spend_cap,
        account_amount_spent: row.account_level_amount_spent,
      })
    }

    const campaign = map.get(key)
    campaign.spend += parseFloat(String(row.spend || 0))
    // Coalesce para suportar tanto Google (conversions_value) quanto Meta (action_value_omni_purchase)
    campaign.revenue += parseFloat(String(row.conversions_value || row.action_value_omni_purchase || 0))
    campaign.conversions += parseInt(String(row.conversions || row.action_omni_purchase || row.action_leads || 0), 10)
    campaign.clicks += parseInt(String(row.clicks || 0), 10)
    campaign.impressions += parseInt(String(row.impressions || 0), 10)
    campaign.dates.push(row.date)
    
    if (!campaign.latest_date || row.date >= campaign.latest_date) {
      if (row.date > campaign.latest_date) {
        campaign.latest_day_spend = parseFloat(String(row.spend || 0))
        campaign.latest_date = row.date
      } else {
        campaign.latest_day_spend += parseFloat(String(row.spend || 0))
      }
    }
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

  // Usar o gasto do último dia para verificar orçamento diário
  const budgetUsage = (campaign.latest_day_spend / campaign.daily_budget) * 100
  const hour = new Date().getHours()

  // Alerta se o gasto estiver alto proporcionalmente ao horário (ex: > 70% antes das 14h)
  if (budgetUsage >= 70 && budgetUsage < 95 && hour < 14) {
    return {
      id: `low_budget_${campaign.campaign_id}_${campaign.platform}`,
      type: 'low_budget',
      severity: 'warning',
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name || 'Sem nome',
      client: campaign.client,
      platform: campaign.platform,
      message: `Gasto diário acelerado: ${budgetUsage.toFixed(0)}% do orçamento utilizado antes das 14h`,
      metrics: { 
        latest_day_spend: campaign.latest_day_spend, 
        daily_budget: campaign.daily_budget,
        budgetUsage 
      },
      actions: [
        'Monitorar performance nas próximas horas',
        'Avaliar aumento de orçamento se o ROAS estiver bom',
        'Revisar lances para desacelerar o gasto',
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
  const budgetUsage = (campaign.latest_day_spend / campaign.daily_budget) * 100
  
  if (budgetUsage >= 95 && hour < 18) {
    return {
      id: `budget_exhausted_${campaign.campaign_id}_${campaign.platform}`,
      type: 'budget_exhausted',
      severity: 'warning',
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name || 'Sem nome',
      client: campaign.client,
      platform: campaign.platform,
      message: `Orçamento diário esgotado (${budgetUsage.toFixed(0)}%) antes das 18h`,
      metrics: { 
        latest_day_spend: campaign.latest_day_spend,
        daily_budget: campaign.daily_budget,
        hour 
      },
      actions: [
        'Aumentar orçamento diário para não perder tráfego noturno',
        'Otimizar estratégia de lances',
        'Avaliar se o ROAS justifica o aumento',
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

function checkAccountBalances(campaignMap: Map<string, any>): Alert[] {
  const accountMap = new Map<string, any>()
  const alerts: Alert[] = []

  // Agrupar métricas por conta
  campaignMap.forEach(campaign => {
    const accountId = campaign.account_id
    if (!accountId) return

    if (!accountMap.has(accountId)) {
      accountMap.set(accountId, {
        account_id: accountId,
        account_name: campaign.account_name,
        client: campaign.client,
        platform: campaign.platform,
        spend_cap: parseFloat(String(campaign.account_spend_cap || 0)),
        amount_spent: parseFloat(String(campaign.account_amount_spent || 0)),
        total_period_spend: 0,
        days_in_period: new Set(campaign.dates).size,
      })
    }

    const account = accountMap.get(accountId)
    account.total_period_spend += campaign.spend
  })

  accountMap.forEach(account => {
    if (account.spend_cap <= 0) return

    const balanceCents = account.spend_cap - account.amount_spent
    const balance = balanceCents / 100
    
    // Média de gasto diário no período
    const avgDailySpend = account.total_period_spend / (account.days_in_period || 1)
    
    if (avgDailySpend > 0) {
      const daysRemaining = balance / avgDailySpend

      if (daysRemaining <= 7) {
        alerts.push({
          id: `account_balance_${account.account_id}`,
          type: 'low_budget', // Reutilizando tipo existente ou poderia ser 'balance_projection'
          severity: daysRemaining <= 3 ? 'critical' : 'warning',
          campaign_id: 'account',
          campaign_name: `Conta: ${account.account_name}`,
          client: account.client,
          platform: account.platform,
          message: `Saldo projetado para acabar em ${Math.ceil(daysRemaining)} dias (Saldo: R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
          metrics: { 
            balance, 
            avg_daily_spend: avgDailySpend,
            days_remaining: daysRemaining 
          },
          actions: [
            'Adicionar saldo à conta',
            'Reduzir lances para prolongar duração',
            'Priorizar campanhas de alta performance',
          ],
          created_at: new Date().toISOString(),
          resolved: false,
        })
      }
    }
  })

  return alerts
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
