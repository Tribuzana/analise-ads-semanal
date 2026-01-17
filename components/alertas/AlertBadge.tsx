'use client'

import { useAlertas } from '@/hooks/useAlertas'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'
import Link from 'next/link'

export function AlertBadge() {
  const { stats, loading } = useAlertas()

  if (loading) return null

  const hasAlerts = stats.total > 0
  const hasCritical = stats.critical > 0

  return (
    <Link href="/alertas">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {hasAlerts && (
          <Badge
            variant="destructive"
            className={`absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs ${
              hasCritical ? 'bg-red-500' : 'bg-yellow-500'
            }`}
          >
            {stats.total > 99 ? '99+' : stats.total}
          </Badge>
        )}
      </Button>
    </Link>
  )
}
