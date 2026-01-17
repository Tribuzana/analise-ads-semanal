'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CampaignStatusFilter } from '@/types/marketing'

interface CampaignStatusFilterProps {
  value: CampaignStatusFilter
  onValueChange: (value: CampaignStatusFilter) => void
}

export function CampaignStatusFilterComponent({
  value,
  onValueChange,
}: CampaignStatusFilterProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filtrar por status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">Ativas</SelectItem>
        <SelectItem value="paused">Pausadas</SelectItem>
        <SelectItem value="all">Todas</SelectItem>
      </SelectContent>
    </Select>
  )
}
