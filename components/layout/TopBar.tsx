'use client'

import { useAuth } from '@/hooks/useAuth'
import { FilterBar } from '@/components/filters/FilterBar'
import { AlertBadge } from '@/components/alertas/AlertBadge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { LogOut, Settings, Building2, Users, BellRing } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function TopBar() {
  const { usuario, signOut } = useAuth()
  const router = useRouter()
  const canAccessSettings = usuario?.nivel_acesso === 'admin' || usuario?.nivel_acesso === 'analista'

  const handleSignOut = async () => {
    try {
      // Limpar localStorage primeiro
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tribuzana_filters')
        localStorage.removeItem('tribuzana_resolved_alerts')
        localStorage.removeItem('tribuzana_sidebar_collapsed')
        localStorage.removeItem('tribuzana_alert_configs')
      }

      // Tentar logout via contexto
      try {
        await signOut()
      } catch (signOutError) {
        console.warn('[handleSignOut] Erro no signOut do contexto, tentando API:', signOutError)
        // Tentar logout via API como fallback
        try {
          await fetch('/api/auth/logout', { method: 'POST' })
        } catch (apiError) {
          console.error('[handleSignOut] Erro na API de logout:', apiError)
        }
      }

      toast.success('Logout realizado com sucesso')
      
      // Forçar redirecionamento
      if (typeof window !== 'undefined') {
        // Usar window.location.href para forçar reload completo
        window.location.href = '/login'
      } else {
        router.push('/login')
        router.refresh()
      }
    } catch (error: any) {
      console.error('[handleSignOut] Erro geral:', error)
      toast.error('Erro ao fazer logout. Redirecionando...')
      
      // Sempre redirecionar mesmo em caso de erro
      if (typeof window !== 'undefined') {
        // Limpar tudo e forçar redirecionamento
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = '/login'
      } else {
        router.push('/login')
        router.refresh()
      }
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="px-6 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <FilterBar />
          </div>

          <div className="flex items-center gap-4">
            <AlertBadge />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={usuario?.avatar_url || ''} />
                    <AvatarFallback>
                      {usuario ? getInitials(usuario.nome_completo) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{usuario?.nome_completo}</p>
                    <p className="text-xs text-muted-foreground">{usuario?.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {usuario?.nivel_acesso}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {canAccessSettings && (
                  <>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger
                        className="gap-2"
                        onClick={(e) => {
                          // Clicar leva para /configuracoes; hover mantém abertura do submenu
                          e.preventDefault()
                          router.push('/configuracoes')
                        }}
                      >
                        <Settings className="h-4 w-4" />
                        Configurações
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-64">
                        <DropdownMenuItem asChild>
                          <Link href="/configuracoes/hoteis" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Hotéis
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/configuracoes/usuarios" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Usuários
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/alertas-config" className="flex items-center gap-2">
                            <BellRing className="h-4 w-4" />
                            Alertas/Webhook
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
