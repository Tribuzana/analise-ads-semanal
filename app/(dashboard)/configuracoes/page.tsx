'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Building2, Users, Webhook } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ConfiguracoesPage() {
  const { usuario, loading } = useAuth()
  const router = useRouter()
  const canAccess = usuario?.nivel_acesso === 'admin' || usuario?.nivel_acesso === 'analista'

  useEffect(() => {
    if (!loading && usuario && !canAccess) {
      toast.error('Acesso restrito a administradores e analistas')
      router.push('/')
    }
  }, [usuario, loading, router, canAccess])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
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
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground">
            Gerencie hotéis, usuários e integrações
          </p>
        </div>
      </div>

      <div className="py-6">
        <Tabs defaultValue="hoteis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hoteis">
            <Building2 className="mr-2 h-4 w-4" />
            Hotéis
          </TabsTrigger>
          <TabsTrigger value="usuarios">
            <Users className="mr-2 h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="mr-2 h-4 w-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hoteis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Hotéis</CardTitle>
              <CardDescription>
                Configure e gerencie os hotéis do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Acesse a página de configuração de hotéis para gerenciar todas as informações dos hotéis cadastrados.
              </p>
              <Link href="/configuracoes/hoteis">
                <button className="text-sm text-primary hover:underline">
                  Ir para Configuração de Hotéis →
                </button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Gerencie usuários e permissões do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Acesse a página de gerenciamento de usuários para criar, editar e gerenciar permissões.
              </p>
              <Link href="/configuracoes/usuarios">
                <button className="text-sm text-primary hover:underline">
                  Ir para Gerenciamento de Usuários →
                </button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>
                Configure webhooks para integrações externas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Os webhooks são configurados por hotel na página de configuração de alertas.
              </p>
              <Link href="/alertas-config">
                <button className="text-sm text-primary hover:underline">
                  Ir para Configuração de Alertas →
                </button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
