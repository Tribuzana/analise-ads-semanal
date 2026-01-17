'use client'

import { useState } from 'react'
import { useHoteis } from '@/hooks/useHoteis'
import { useFilterContext } from '@/contexts/FilterContext'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function EstadoSelector() {
  const { hoteis } = useHoteis()
  const { selectedEstados, setSelectedEstados } = useFilterContext()
  const [open, setOpen] = useState(false)

  // Obter estados únicos dos hotéis
  const estados = Array.from(
    new Set(
      hoteis
        .map(h => h.estado)
        .filter((estado): estado is string => estado !== null && estado !== '')
    )
  ).sort()

  const toggleEstado = (estado: string) => {
    if (selectedEstados.includes(estado)) {
      setSelectedEstados(selectedEstados.filter(e => e !== estado))
    } else {
      setSelectedEstados([...selectedEstados, estado])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-2',
            selectedEstados.length > 0 && 'bg-primary/10 border-primary'
          )}
        >
          <MapPin className="h-4 w-4" />
          Estados
          {selectedEstados.length > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {selectedEstados.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Filtrar por Estado</Label>
            <p className="text-xs text-muted-foreground">
              Selecione um ou mais estados
            </p>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {estados.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum estado disponível
              </p>
            ) : (
              estados.map((estado) => (
                <div key={estado} className="flex items-center space-x-2">
                  <Checkbox
                    id={`estado-${estado}`}
                    checked={selectedEstados.includes(estado)}
                    onCheckedChange={() => toggleEstado(estado)}
                  />
                  <Label
                    htmlFor={`estado-${estado}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {estado}
                  </Label>
                </div>
              ))
            )}
          </div>
          {selectedEstados.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setSelectedEstados([])}
            >
              Limpar seleção
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
