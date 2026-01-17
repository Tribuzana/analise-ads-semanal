import { NextRequest, NextResponse } from 'next/server'
import { generateAlerts } from '@/lib/actions/alertas/generate-alerts'
import { getDefaultDateRange } from '@/lib/utils/date-helpers'
import type { FilterState } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.WEBHOOK_SECRET || 'your-secret-token'

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    if (token !== expectedToken) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Buscar alertas
    const { startDate, endDate } = getDefaultDateRange()
    const defaultFilters: FilterState = {
      selectedHotels: [],
      startDate,
      endDate,
      selectedCidades: [],
      selectedEstados: [],
      compareYearAgo: false,
      selectedObjectives: [],
      selectedResultTypes: [],
    }

    const alerts = await generateAlerts(defaultFilters)

    // Formatar payload para N8N
    const payload = alerts.map(alert => ({
      alert_id: alert.id,
      timestamp: alert.created_at,
      hotel: alert.client,
      campaign: {
        name: alert.campaign_name,
        id: alert.campaign_id,
        platform: alert.platform,
      },
      alert: {
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
      },
      metrics: alert.metrics,
      actions: alert.actions,
    }))

    return NextResponse.json({
      success: true,
      count: payload.length,
      alerts: payload,
    })
  } catch (error: any) {
    console.error('[Webhook] Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
