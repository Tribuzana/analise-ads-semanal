import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export const filterSchema = z.object({
  hotelId: z.number().optional(),
  startDate: z.string(),
  endDate: z.string(),
  platform: z.enum(['Google Ads', 'Meta Ads', 'all']).optional(),
})

export const alertaConfigSchema = z.object({
  hotel_id: z.number(),
  alerta_ativo: z.boolean(),
  alerta_threshold: z.number().min(0).max(100),
  alerta_periodo_minutos: z.number().min(5).max(1440),
})
