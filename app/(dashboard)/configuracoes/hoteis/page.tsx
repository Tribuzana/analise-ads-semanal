'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Hotel = Database['public']['Tables']['hoteis_config']['Row']
type HotelUpdate = Database['public']['Tables']['hoteis_config']['Update']

export default function HoteisConfigPage() {
  const { usuario, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const canAccess = usuario?.nivel_acesso === 'admin' || usuario?.nivel_acesso === 'analista'
  
  const [hoteis, setHoteis] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  const filteredHoteis = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return hoteis
    return hoteis.filter(h => {
      const nome = (h.nome_hotel || '').toLowerCase()
      const fantasia = (h.nome_fantasia || '').toLowerCase()
      const cidade = (h.cidade || '').toLowerCase()
      const estado = (h.estado || '').toLowerCase()
      return (
        nome.includes(q) ||
        fantasia.includes(q) ||
        cidade.includes(q) ||
        estado.includes(q)
      )
    })
  }, [hoteis, search])

  useEffect(() => {
    if (!authLoading && usuario && !canAccess) {
      toast.error('Acesso restrito a administradores e analistas')
      router.push('/')
    }
  }, [usuario, authLoading, router, canAccess])

  const fetchHoteis = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('hoteis_config')
        .select('*')
        .order('nome_hotel')

      if (error) throw error
      setHoteis(data || [])
    } catch (error: any) {
      toast.error('Erro ao carregar hotéis: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchHoteis()
  }, [fetchHoteis])

  const handleSave = async (hotel: HotelUpdate) => {
    try {
      if (editingHotel) {
        const { error } = await (supabase.from('hoteis_config') as any)
          .update(hotel)
          .eq('id', editingHotel.id)

        if (error) throw error
        toast.success('Hotel atualizado com sucesso!')
      } else {
        const { error } = await (supabase.from('hoteis_config') as any)
          .insert([hotel])

        if (error) throw error
        toast.success('Hotel criado com sucesso!')
      }

      setShowForm(false)
      setEditingHotel(null)
      fetchHoteis()
    } catch (error: any) {
      toast.error('Erro ao salvar hotel: ' + error.message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este hotel?')) return

    try {
      const { error } = await (supabase.from('hoteis_config') as any)
        .update({ ativo: false })
        .eq('id', id)

      if (error) throw error
      toast.success('Hotel desativado com sucesso!')
      fetchHoteis()
    } catch (error: any) {
      toast.error('Erro ao desativar hotel: ' + error.message)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (!canAccess) {
    return null
  }

  return (
    <div className="space-y-10 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Hotéis</h1>
            <p className="text-muted-foreground">
              Configure e gerencie os hotéis do sistema
            </p>
          </div>
        </div>
        <div className="flex w-full max-w-[520px] items-center gap-3 justify-end">
          <div className="w-full max-w-[320px]">
            <Input
              placeholder="Filtrar hotéis por nome, cidade ou UF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => {
            setEditingHotel(null)
            setShowForm(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Hotel
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="py-6">
          <HotelForm
            hotel={editingHotel}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false)
              setEditingHotel(null)
            }}
          />
        </div>
      )}

      <div className="py-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredHoteis.map((hotel) => (
          <Card key={hotel.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{hotel.nome_fantasia || hotel.nome_hotel}</CardTitle>
                  <CardDescription>{hotel.nome_hotel}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingHotel(hotel)
                      setShowForm(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(hotel.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">Cidade/Estado</p>
                <p className="text-sm text-muted-foreground">
                  {hotel.cidade || 'N/A'} / {hotel.estado || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Motor de Reserva</p>
                <p className="text-sm text-muted-foreground">{hotel.motor_reserva}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ativo</span>
                <Switch checked={hotel.ativo} disabled />
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      </div>
    </div>
  )
}

function HotelForm({
  hotel,
  onSave,
  onCancel,
}: {
  hotel: Hotel | null
  onSave: (hotel: HotelUpdate) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    nome_hotel: hotel?.nome_hotel || '',
    nome_fantasia: hotel?.nome_fantasia || '',
    cidade: hotel?.cidade || '',
    estado: hotel?.estado || '',
    motor_reserva: hotel?.motor_reserva || 'hbook',
    motor_id: hotel?.motor_id || '',
    ativo: hotel?.ativo ?? true,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{hotel ? 'Editar Hotel' : 'Novo Hotel'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome_hotel">Nome do Hotel *</Label>
            <Input
              id="nome_hotel"
              value={formData.nome_hotel}
              onChange={(e) => setFormData({ ...formData, nome_hotel: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
            <Input
              id="nome_fantasia"
              value={formData.nome_fantasia}
              onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Input
              id="estado"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              maxLength={2}
              placeholder="SP"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motor_reserva">Motor de Reserva</Label>
            <Select
              value={formData.motor_reserva}
              onValueChange={(value) => setFormData({ ...formData, motor_reserva: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hbook">HBook</SelectItem>
                <SelectItem value="omnibees">Omnibees</SelectItem>
                <SelectItem value="letsbook">LetsBook</SelectItem>
                <SelectItem value="foco">Foco</SelectItem>
                <SelectItem value="silbeck">Silbeck</SelectItem>
                <SelectItem value="dpny">DPNY</SelectItem>
                <SelectItem value="niara">Niara</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="motor_id">ID do Motor *</Label>
            <Input
              id="motor_id"
              value={formData.motor_id}
              onChange={(e) => setFormData({ ...formData, motor_id: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
            />
            <Label>Hotel Ativo</Label>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={() => onSave(formData)}>
              Salvar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
