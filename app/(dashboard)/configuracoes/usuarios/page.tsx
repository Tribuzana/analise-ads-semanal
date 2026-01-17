'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Usuario = Database['public']['Tables']['usuarios']['Row']
type UsuarioUpdate = Database['public']['Tables']['usuarios']['Update']

export default function UsuariosConfigPage() {
  const { usuario, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!authLoading && usuario && usuario.nivel_acesso !== 'admin') {
      toast.error('Acesso restrito a administradores')
      router.push('/')
    }
  }, [usuario, authLoading, router])

  const fetchUsuarios = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome_completo')

      if (error) throw error
      setUsuarios(data || [])
    } catch (error: any) {
      toast.error('Erro ao carregar usuários: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUsuarios()
  }, [fetchUsuarios])

  const handleSave = async (usuarioData: UsuarioUpdate) => {
    try {
      if (editingUsuario) {
        const { error } = await (supabase.from('usuarios') as any)
          .update(usuarioData)
          .eq('id', editingUsuario.id)

        if (error) throw error
        toast.success('Usuário atualizado com sucesso!')
      } else {
        toast.error('Criação de usuários deve ser feita através do Supabase Auth')
        return
      }

      setShowForm(false)
      setEditingUsuario(null)
      fetchUsuarios()
    } catch (error: any) {
      toast.error('Erro ao salvar usuário: ' + error.message)
    }
  }

  const handleToggleActive = async (id: string, ativo: boolean) => {
    try {
      const { error } = await (supabase.from('usuarios') as any)
        .update({ ativo: !ativo })
        .eq('id', id)

      if (error) throw error
      toast.success(`Usuário ${!ativo ? 'ativado' : 'desativado'} com sucesso!`)
      fetchUsuarios()
    } catch (error: any) {
      toast.error('Erro ao atualizar usuário: ' + error.message)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (usuario?.nivel_acesso !== 'admin') {
    return null
  }

  return (
    <div className="space-y-10 pb-8">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários e permissões do sistema
          </p>
        </div>
      </div>

      {showForm && editingUsuario && (
        <div className="py-6">
          <UsuarioForm
            usuario={editingUsuario}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false)
              setEditingUsuario(null)
            }}
          />
        </div>
      )}

      <div className="py-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {usuarios.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{user.nome_completo}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingUsuario(user)
                    setShowForm(true)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">Nível de Acesso</p>
                <p className="text-sm text-muted-foreground capitalize">{user.nivel_acesso}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ativo</span>
                <Switch
                  checked={user.ativo}
                  onCheckedChange={() => handleToggleActive(user.id, user.ativo)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      </div>
    </div>
  )
}

function UsuarioForm({
  usuario,
  onSave,
  onCancel,
}: {
  usuario: Usuario
  onSave: (usuario: UsuarioUpdate) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    nome_completo: usuario.nome_completo,
    nivel_acesso: usuario.nivel_acesso,
    ativo: usuario.ativo,
    telefone: usuario.telefone || '',
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar Usuário</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={usuario.email} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nome_completo">Nome Completo *</Label>
          <Input
            id="nome_completo"
            value={formData.nome_completo}
            onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nivel_acesso">Nível de Acesso</Label>
          <Select
            value={formData.nivel_acesso}
            onValueChange={(value: any) => setFormData({ ...formData, nivel_acesso: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="gerente">Gerente</SelectItem>
              <SelectItem value="analista">Analista</SelectItem>
              <SelectItem value="usuario">Usuário</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
            />
            <Label>Usuário Ativo</Label>
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
