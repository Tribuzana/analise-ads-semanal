'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useHoteis } from '@/hooks/useHoteis'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Settings, Save, TestTube } from 'lucide-react'
import type { AlertConfig } from '@/types/alertas'
import { useRouter } from 'next/navigation'

export default function AlertasConfigPage() {
  const { usuario } = useAuth()
  const { hoteis } = useHoteis()
  const router = useRouter()
  const canAccess = usuario?.nivel_acesso === 'admin' || usuario?.nivel_acesso === 'analista'

  const [selectedHotel, setSelectedHotel] = useState<number | null>(null)
  const [config, setConfig] = useState<AlertConfig>({
    hotelId: 0,
    nomeHotel: '',
    rules: {
      roasMin: 2.0,
      cpaMax: 500,
      ctrMin: 1.0,
    },
    webhookUrl: null,
    webhookSecret: null,
    webhookActive: false,
  })

  // Verificar permissão de admin
  useEffect(() => {
    if (usuario && !canAccess) {
      toast.error('Acesso restrito a administradores e analistas')
      router.push('/')
    }
  }, [usuario, router, canAccess])

  // Carregar configuração ao selecionar hotel
  useEffect(() => {
    if (selectedHotel) {
      const hotel = hoteis.find(h => h.id === selectedHotel)
      if (hotel) {
        const configs = getConfigs()
        const saved = configs.find(c => c.hotelId === selectedHotel)

        if (saved) {
          setConfig(saved)
        } else {
          setConfig({
            hotelId: hotel.id,
            nomeHotel: hotel.nome_hotel,
            rules: {
              roasMin: 2.0,
              cpaMax: 500,
              ctrMin: 1.0,
            },
            webhookUrl: null,
            webhookSecret: null,
            webhookActive: false,
          })
        }
      }
    }
  }, [selectedHotel, hoteis])

  const handleSave = () => {
    const configs = getConfigs()
    const index = configs.findIndex(c => c.hotelId === config.hotelId)

    if (index >= 0) {
      configs[index] = config
    } else {
      configs.push(config)
    }

    localStorage.setItem('tribuzana_alert_configs', JSON.stringify(configs))
    toast.success('Configurações salvas com sucesso!')
  }

  const handleTestWebhook = async () => {
    if (!config.webhookUrl) {
      toast.error('Configure a URL do webhook primeiro')
      return
    }

    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.webhookSecret && {
            'Authorization': `Bearer ${config.webhookSecret}`
          }),
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          message: 'Teste de webhook do Tribuzana',
        }),
      })

      if (response.ok) {
        toast.success('Webhook testado com sucesso!')
      } else {
        toast.error(`Erro ao testar webhook: ${response.status}`)
      }
    } catch (error) {
      toast.error('Erro ao conectar com o webhook')
      console.error(error)
    }
  }

  const generateSecret = () => {
    const secret = Math.random().toString(36).substring(2, 15) +
                   Math.random().toString(36).substring(2, 15)
    setConfig({ ...config, webhookSecret: secret })
  }

  if (!canAccess) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-red-600">Acesso restrito</p>
          <p className="text-sm text-muted-foreground">
            Esta página é acessível apenas para administradores e analistas
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-8">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Configuração de Alertas</h1>
          <p className="text-muted-foreground">
            Configure regras personalizadas e webhook N8N
          </p>
        </div>
      </div>

      {/* Seletor de Hotel */}
      <div className="py-6">
        <Card>
        <CardHeader>
          <CardTitle>Selecione o Hotel</CardTitle>
          <CardDescription>
            Configure alertas específicos para cada hotel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedHotel?.toString()}
            onValueChange={(value) => setSelectedHotel(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um hotel" />
            </SelectTrigger>
            <SelectContent>
              {hoteis.map((hotel) => (
                <SelectItem key={hotel.id} value={hotel.id.toString()}>
                  {hotel.nome_fantasia || hotel.nome_hotel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      </div>

      {selectedHotel && (
        <>
          {/* Regras de Performance */}
          <div className="py-6">
            <Card>
            <CardHeader>
              <CardTitle>Regras de Performance</CardTitle>
              <CardDescription>
                Defina os limites para alertas de baixa performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="roas">ROAS Mínimo</Label>
                  <Input
                    id="roas"
                    type="number"
                    step="0.1"
                    value={config.rules.roasMin}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        rules: { ...config.rules, roasMin: Number(e.target.value) },
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Alerta se ROAS &lt; {config.rules.roasMin}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpa">CPA Máximo (R$)</Label>
                  <Input
                    id="cpa"
                    type="number"
                    step="10"
                    value={config.rules.cpaMax}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        rules: { ...config.rules, cpaMax: Number(e.target.value) },
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Alerta se CPA &gt; R$ {config.rules.cpaMax}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ctr">CTR Mínimo (%)</Label>
                  <Input
                    id="ctr"
                    type="number"
                    step="0.1"
                    value={config.rules.ctrMin}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        rules: { ...config.rules, ctrMin: Number(e.target.value) },
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Alerta se CTR &lt; {config.rules.ctrMin}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Webhook N8N */}
          <div className="py-6">
            <Card>
            <CardHeader>
              <CardTitle>Webhook N8N</CardTitle>
              <CardDescription>
                Configure webhook para receber alertas no N8N
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Webhook Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar alertas automaticamente
                  </p>
                </div>
                <Switch
                  checked={config.webhookActive}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, webhookActive: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-url">URL do Webhook</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://n8n.example.com/webhook/alertas"
                  value={config.webhookUrl || ''}
                  onChange={(e) =>
                    setConfig({ ...config, webhookUrl: e.target.value || null })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="webhook-secret">Secret Token</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateSecret}
                  >
                    Gerar Token
                  </Button>
                </div>
                <Input
                  id="webhook-secret"
                  type="text"
                  placeholder="Token de autenticação"
                  value={config.webhookSecret || ''}
                  onChange={(e) =>
                    setConfig({ ...config, webhookSecret: e.target.value || null })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Use este token como Bearer token no N8N
                </p>
              </div>

              <Button
                variant="outline"
                onClick={handleTestWebhook}
                disabled={!config.webhookUrl}
              >
                <TestTube className="mr-2 h-4 w-4" />
                Testar Webhook
              </Button>
            </CardContent>
          </Card>
          </div>

          {/* Salvar */}
          <div className="py-6 flex justify-end">
            <Button onClick={handleSave} size="lg">
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

function getConfigs(): AlertConfig[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem('tribuzana_alert_configs')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}
