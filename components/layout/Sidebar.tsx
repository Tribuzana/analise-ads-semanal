'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { 
  LayoutDashboard, 
  TrendingUp, 
  Globe, 
  Facebook,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Marketing Analytics', href: '/marketing-analytics', icon: TrendingUp },
  { name: 'Google Ads', href: '/google-ads', icon: Globe },
  { name: 'Meta Ads', href: '/meta-ads', icon: Facebook },
  { name: 'Reservas', href: '/reservas', icon: Calendar },
  { name: 'Alertas', href: '/alertas', icon: Bell },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Carregar estado do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tribuzana_sidebar_collapsed')
      if (saved !== null) {
        setCollapsed(JSON.parse(saved))
      }
    }
  }, [])

  // Salvar estado no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tribuzana_sidebar_collapsed', JSON.stringify(collapsed))
    }
  }, [collapsed])

  const toggleCollapse = () => {
    setCollapsed(!collapsed)
  }

  return (
    <aside
      className={cn(
        'hidden border-r bg-card lg:block transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header com logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {collapsed ? (
            <div className="flex items-center justify-center w-full">
              <Image
                src="/logo-tribuzana.png"
                alt="Tribuzana"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Image
                src="/logo-tribuzana.png"
                alt="Tribuzana"
                width={32}
                height={32}
                className="object-contain"
              />
              <h1 className="text-xl font-bold text-primary">Tribuzana</h1>
            </div>
          )}
        </div>

        {/* Navegação */}
        <nav className="flex-1 space-y-1 p-4">
          <TooltipProvider>
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    collapsed ? 'justify-center' : '',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.name}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return <div key={item.name}>{linkContent}</div>
            })}
          </TooltipProvider>
        </nav>

        {/* Botão de toggle */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="w-full"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}
