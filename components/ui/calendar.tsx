import * as React from "react"
import { DayPicker, useNavigation } from "react-day-picker"
import { cn } from "@/lib/utils/cn"
import { buttonVariants } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function InlineMonthCaption({
  calendarMonth,
}: {
  calendarMonth: { date: Date }
} & React.HTMLAttributes<HTMLDivElement>) {
  const { goToMonth, nextMonth, previousMonth } = useNavigation()
  const label = calendarMonth.date
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^./, (c: string) => c.toUpperCase())

  return (
    <div
      className="flex items-center justify-between pt-1"
      data-calendar-caption="true"
    >
      <span className="text-sm font-medium" data-calendar-caption-label="true">
        {label}
      </span>
      <div className="flex items-center gap-1" data-calendar-inline-nav="true">
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-7 w-7 p-0 rounded-md"
          )}
          onClick={() => previousMonth && goToMonth(previousMonth)}
          disabled={!previousMonth}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-7 w-7 p-0 rounded-md"
          )}
          onClick={() => nextMonth && goToMonth(nextMonth)}
          disabled={!nextMonth}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  numberOfMonths = 1,
  ...props
}: CalendarProps) {
  const debugRootRef = React.useRef<HTMLDivElement | null>(null)

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H1',location:'components/ui/calendar.tsx:Calendar',message:'Calendar render props snapshot',data:{numberOfMonths,showOutsideDays,hasLocale:Boolean((props as any).locale),localeCode:(props as any).locale?.code,localeName:(props as any).locale?.options?.locale,hasClassNamesOverride:Boolean(classNames),className},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  // react-day-picker v9 renomeou várias chaves do classNames.
  // Mantemos algumas chaves antigas como aliases (não atrapalham) e usamos as novas chaves também.
  const monthGrid = "w-full border-collapse space-y-1"
  const weekdayRow = "flex"
  const weekdayCell = "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]"
  const weekRow = "flex w-full mt-2"
  const captionRow = "flex items-center justify-between pt-1"
  const dayCell =
    "h-10 w-10 text-center text-sm p-0 relative rounded-md hover:bg-accent hover:text-accent-foreground focus-within:relative focus-within:z-20"
  const dayButton = cn(
    buttonVariants({ variant: "ghost" }),
    "h-10 w-10 p-0 font-normal aria-selected:opacity-100"
  )

  const mergedClassNames = {
    months: "flex flex-col space-y-4",
    month: "space-y-4",
    // header do mês: mês à esquerda, setas à direita
    // v8 key (alias)
    caption: captionRow,
    // v9 keys (algumas versões migraram caption -> month_caption / MonthCaption)
    month_caption: captionRow,
    MonthCaption: captionRow,
    caption_label: "text-sm font-medium",
    CaptionLabel: "text-sm font-medium",
    nav: "flex items-center gap-1",
    nav_button: cn(
      buttonVariants({ variant: "ghost" }),
      "h-7 w-7 p-0 rounded-md"
    ),
    nav_button_previous: "",
    nav_button_next: "",
    // v9 keys (algumas versões migraram nav_button_* -> button_* / NextMonthButton etc.)
    button_previous: cn(buttonVariants({ variant: "ghost" }), "h-7 w-7 p-0 rounded-md"),
    button_next: cn(buttonVariants({ variant: "ghost" }), "h-7 w-7 p-0 rounded-md"),
    PreviousMonthButton: cn(buttonVariants({ variant: "ghost" }), "h-7 w-7 p-0 rounded-md"),
    NextMonthButton: cn(buttonVariants({ variant: "ghost" }), "h-7 w-7 p-0 rounded-md"),

    // v9 keys
    month_grid: monthGrid,
    weekdays: weekdayRow,
    weekday: weekdayCell,
    week: weekRow,
    day: dayCell,
    day_button: dayButton,

    // aliases (v8 / legacy) - mantidos para compatibilidade e logs
    table: monthGrid,
    head_row: weekdayRow,
    head_cell: weekdayCell,
    row: weekRow,
    cell: dayCell,

    // v9 modifier keys (estilo padrão e mais claro para seleção)
    selected:
      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
    today: "bg-accent text-accent-foreground",
    outside: "text-muted-foreground/60 opacity-60",
    disabled: "text-muted-foreground opacity-50",
    // miolo do range: mantém leitura e reforça seleção (mais intuitivo)
    range_middle: "bg-primary/10 text-foreground rounded-none",
    range_start:
      "bg-primary text-primary-foreground rounded-l-md rounded-r-none",
    range_end:
      "bg-primary text-primary-foreground rounded-r-md rounded-l-none",

    // aliases (v8 / legado)
    day_selected:
      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
    day_outside:
      "day-outside text-muted-foreground/60 opacity-60",
    day_disabled: "text-muted-foreground opacity-50",
    day_range_middle:
      "aria-selected:bg-accent aria-selected:text-accent-foreground",
    day_range_end: "day-range-end",
    day_hidden: "invisible",
    ...classNames,
  } as const

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'post-fix',hypothesisId:'H4',location:'components/ui/calendar.tsx:Calendar',message:'Calendar v9 classNames snapshot',data:{month_grid:(mergedClassNames as any).month_grid,weekdays:(mergedClassNames as any).weekdays,weekday:(mergedClassNames as any).weekday,week:(mergedClassNames as any).week,day:(mergedClassNames as any).day,day_button:(mergedClassNames as any).day_button},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H2',location:'components/ui/calendar.tsx:Calendar',message:'Calendar merged classNames keys',data:{months:mergedClassNames.months,caption:mergedClassNames.caption,head_row:mergedClassNames.head_row,head_cell:mergedClassNames.head_cell,row:mergedClassNames.row,cell:mergedClassNames.cell,day:mergedClassNames.day},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  React.useEffect(() => {
    const root = debugRootRef.current
    if (!root) return

    const rect = root.getBoundingClientRect()
    const columnHeaders = Array.from(root.querySelectorAll<HTMLElement>('[role="columnheader"]'))
    const headerSample = columnHeaders.slice(0, 7).map((el) => {
      const cs = window.getComputedStyle(el)
      return {
        text: (el.textContent || '').trim(),
        className: el.className,
        display: cs.display,
        width: cs.width,
        flex: cs.flex,
        whiteSpace: cs.whiteSpace,
      }
    })

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run2',hypothesisId:'H6',location:'components/ui/calendar.tsx:useEffect',message:'DayPicker DOM snapshot (weekday headers)',data:{rootWidth:rect.width,rootClass:root.className,columnHeaderCount:columnHeaders.length,headerSample},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const navEl = root.querySelector<HTMLElement>('nav[aria-label="Navigation bar"]')

    const navRect2 = navEl?.getBoundingClientRect()

    const navAncestors: Array<{ tag: string; className: string; text: string }> = []
    let cur: HTMLElement | null = navEl?.parentElement ?? null
    for (let i = 0; i < 6 && cur; i++) {
      navAncestors.push({
        tag: cur.tagName,
        className: cur.className,
        text: (cur.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60),
      })
      cur = cur.parentElement
    }

    // Tentativa de localizar o "título do mês" de forma agnóstica ao CSS default.
    // Heurística: textos curtos que contém um ano (ex.: 2026).
    const candidates = Array.from(root.querySelectorAll<HTMLElement>("*"))
      .map((el) => {
        const t = (el.textContent || "").replace(/\s+/g, " ").trim()
        return { el, t }
      })
      .filter(({ t }) => /\b(19|20)\d{2}\b/.test(t) && t.length > 4 && t.length <= 30)
      .slice(0, 8)
      .map(({ el, t }) => ({
        tag: el.tagName,
        className: el.className,
        text: t,
        rect: (() => {
          const r = el.getBoundingClientRect()
          return { left: r.left, right: r.right, top: r.top, width: r.width }
        })(),
      }))

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run6',hypothesisId:'H11',location:'components/ui/calendar.tsx:useEffect',message:'Caption/nav DOM snapshot (heuristic)',data:{rootWidth:rect.width,hasNav:Boolean(navEl),navClass:navEl?.className,navRect:navRect2?{left:navRect2.left,right:navRect2.right,top:navRect2.top,width:navRect2.width}:null,navAncestors,candidates},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const inlineCaptionEl = root.querySelector<HTMLElement>('[data-calendar-caption="true"]')
    const inlineNavEl = root.querySelector<HTMLElement>('[data-calendar-inline-nav="true"]')
    const inlineCaptionRect = inlineCaptionEl?.getBoundingClientRect()
    const inlineNavRect = inlineNavEl?.getBoundingClientRect()

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run7',hypothesisId:'H13',location:'components/ui/calendar.tsx:useEffect',message:'Inline caption/nav rects',data:{hasInlineCaption:Boolean(inlineCaptionEl),hasInlineNav:Boolean(inlineNavEl),inlineCaptionRect:inlineCaptionRect?{left:inlineCaptionRect.left,right:inlineCaptionRect.right,top:inlineCaptionRect.top,width:inlineCaptionRect.width}:null,inlineNavRect:inlineNavRect?{left:inlineNavRect.left,right:inlineNavRect.right,top:inlineNavRect.top,width:inlineNavRect.width}:null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const outsideDays = Array.from(
      root.querySelectorAll<HTMLElement>('[data-outside]')
    )
    const outsideSample = outsideDays.slice(0, 5).map((el) => {
      const cs = window.getComputedStyle(el)
      return {
        className: el.className,
        display: cs.display,
        opacity: cs.opacity,
        color: cs.color,
      }
    })

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run2',hypothesisId:'H8',location:'components/ui/calendar.tsx:useEffect',message:'DayPicker outside days computed styles',data:{outsideCount:outsideDays.length,outsideSample},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const selectedEls = Array.from(
      root.querySelectorAll<HTMLElement>('[aria-selected="true"], [data-selected]')
    )
    const selectedSample = selectedEls.slice(0, 8).map((el) => {
      const cs = window.getComputedStyle(el)
      return {
        tag: el.tagName,
        className: el.className,
        ariaSelected: el.getAttribute("aria-selected"),
        bg: cs.backgroundColor,
        color: cs.color,
        borderRadius: cs.borderRadius,
      }
    })

    const captionEl = navEl?.parentElement as HTMLElement | null
    const navRect = navEl?.getBoundingClientRect()
    const captionRect = captionEl?.getBoundingClientRect()
    const captionText =
      (captionEl?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80)

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run3',hypothesisId:'H9',location:'components/ui/calendar.tsx:useEffect',message:'DayPicker selection + nav layout snapshot',data:{selectedCount:selectedEls.length,selectedSample,hasNav:Boolean(navEl),navClass:navEl?.className,captionClass:captionEl?.className,captionText,navRect:navRect?{left:navRect.left,right:navRect.right,top:navRect.top,width:navRect.width}:null,captionRect:captionRect?{left:captionRect.left,right:captionRect.right,top:captionRect.top,width:captionRect.width}:null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const firstWeekRow = root.querySelector<HTMLElement>('[role="row"]')
    if (firstWeekRow) {
      const cs = window.getComputedStyle(firstWeekRow)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run2',hypothesisId:'H7',location:'components/ui/calendar.tsx:useEffect',message:'DayPicker first row computed styles',data:{rowClass:firstWeekRow.className,display:cs.display,width:cs.width,gap:cs.gap,justifyContent:cs.justifyContent},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }
  }, [numberOfMonths, showOutsideDays, (props as any).locale, className, classNames])

  return (
    <div ref={debugRootRef} className="calendar-debug-root">
      <DayPicker
        showOutsideDays={showOutsideDays}
        numberOfMonths={numberOfMonths}
        captionLayout="label"
        navLayout="after"
        hideNavigation
        components={{ MonthCaption: InlineMonthCaption }}
        className={cn("p-0", className)}
        classNames={mergedClassNames}
        {...props}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
