'use client'

import { useState } from 'react'
import { useFilterContext } from '@/contexts/FilterContext'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Filter, ChevronDown } from 'lucide-react'

const CAMPAIGN_OBJECTIVES = [
  'Vendas',
  'Busca',
  'Performance Max',
  'Engajamento',
  'Leads',
  'Tráfego',
  'Hotel',
  'Geração de Demanda',
  'Inteligente',
  'Vídeo',
  'Cliques em Links',
  'Mensagens',
]

const RESULT_TYPES = [
  'Conversões',
  'Leads',
  'Cliques em Links',
  'Engajamentos em Posts',
  'Compras',
]

export function AdvancedFilters() {
  const [open, setOpen] = useState(false)
  const { selectedObjectives, setSelectedObjectives, selectedResultTypes, setSelectedResultTypes } = useFilterContext()

  const toggleObjective = (objective: string) => {
    if (selectedObjectives.includes(objective)) {
      setSelectedObjectives(selectedObjectives.filter(o => o !== objective))
    } else {
      setSelectedObjectives([...selectedObjectives, objective])
    }
  }

  const toggleResultType = (resultType: string) => {
    if (selectedResultTypes.includes(resultType)) {
      setSelectedResultTypes(selectedResultTypes.filter(r => r !== resultType))
    } else {
      setSelectedResultTypes([...selectedResultTypes, resultType])
    }
  }

  const selectAllObjectives = () => {
    setSelectedObjectives(CAMPAIGN_OBJECTIVES)
  }

  const clearAllObjectives = () => {
    setSelectedObjectives([])
  }

  const selectAllResultTypes = () => {
    setSelectedResultTypes(RESULT_TYPES)
  }

  const clearAllResultTypes = () => {
    setSelectedResultTypes([])
  }

  const totalSelected = selectedObjectives.length + selectedResultTypes.length
  const displayText = totalSelected === 0 
    ? 'Filtros Avançados' 
    : `${totalSelected} filtro(s) selecionado(s)`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between sm:w-[200px]">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>{displayText}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        {/* Seção Objetivo de Campanha */}
        <div className="border-b">
          <div className="flex items-center justify-between border-b p-3">
            <span className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Objetivo de Campanha
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllObjectives}
                className="h-7 text-xs"
              >
                Todos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllObjectives}
                className="h-7 text-xs"
              >
                Limpar
              </Button>
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-3">
            <div className="space-y-2">
              {CAMPAIGN_OBJECTIVES.map((objective) => (
                <div
                  key={objective}
                  className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent"
                >
                  <Checkbox
                    id={`objective-${objective}`}
                    checked={selectedObjectives.includes(objective)}
                    onCheckedChange={() => toggleObjective(objective)}
                  />
                  <label
                    htmlFor={`objective-${objective}`}
                    className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {objective}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Seção Tipo de Resultado */}
        <div>
          <div className="flex items-center justify-between border-b p-3">
            <span className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Tipo de Resultado
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllResultTypes}
                className="h-7 text-xs"
              >
                Todos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllResultTypes}
                className="h-7 text-xs"
              >
                Limpar
              </Button>
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-3">
            <div className="space-y-2">
              {RESULT_TYPES.map((resultType) => (
                <div
                  key={resultType}
                  className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent"
                >
                  <Checkbox
                    id={`resultType-${resultType}`}
                    checked={selectedResultTypes.includes(resultType)}
                    onCheckedChange={() => toggleResultType(resultType)}
                  />
                  <label
                    htmlFor={`resultType-${resultType}`}
                    className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {resultType}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
