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

export function CidadeSelector() {
  const { hoteis } = useHoteis()
  const { selectedCidades, setSelectedCidades } = useFilterContext()
  const [open, setOpen] = useState(false)

  // Obter cidades únicas dos hotéis
  const cidades = Array.from(
    new Set(
      hoteis
        .map(h => h.cidade)
        .filter((cidade): cidade is string => cidade !== null && cidade !== '')
    )
  ).sort()

  const toggleCidade = (cidade: string) => {
    if (selectedCidades.includes(cidade)) {
      setSelectedCidades(selectedCidades.filter(c => c !== cidade))
    } else {
      setSelectedCidades([...selectedCidades, cidade])
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
            selectedCidades.length > 0 && 'bg-primary/10 border-primary'
          )}
        >
          <MapPin className="h-4 w-4" />
          Cidades
          {selectedCidades.length > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {selectedCidades.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Filtrar por Cidade</Label>
            <p className="text-xs text-muted-foreground">
              Selecione uma ou mais cidades
            </p>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {cidades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma cidade disponível
              </p>
            ) : (
              cidades.map((cidade) => (
                <div key={cidade} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cidade-${cidade}`}
                    checked={selectedCidades.includes(cidade)}
                    onCheckedChange={() => toggleCidade(cidade)}
                  />
                  <Label
                    htmlFor={`cidade-${cidade}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {cidade}
                  </Label>
                </div>
              ))
            )}
          </div>
          {selectedCidades.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setSelectedCidades([])}
            >
              Limpar seleção
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
