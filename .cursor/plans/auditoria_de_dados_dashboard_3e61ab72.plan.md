# Plano de Correção: Lógica de Filtro por Hotel (Google vs Meta)

O objetivo é corrigir a filtragem de hotéis, que atualmente funciona para Google Ads mas falha para Meta Ads devido a inconsistências na coluna `client` do banco de dados (onde os valores estão invertidos ou incorretos para Meta).

## Diagnóstico
- Na tabela `metricas_ads`, a coluna `client` é confiável para Google Ads.
- Para Meta Ads, a coluna `account_name` contém o nome real do hotel, enquanto a coluna `client` pode estar incorreta (ex: "grinbergs" para uma conta do DPNY).
- O filtro atual usa apenas a coluna `client`, o que exclui os dados de Meta quando um hotel é selecionado.

## Ações

### 1. Atualizar o Helper de Filtragem Centralizado
Modificar `lib/supabase/filter-helpers.ts` para:
- Buscar `platform`, `client`, `account_name` e `account_id` de forma única para o período.
- Implementar uma lógica de correspondência inteligente:
  - **Google**: Validar contra a coluna `client`.
  - **Meta**: Validar contra a coluna `account_name` (e opcionalmente `client` como backup).
- Retornar uma lista de `account_id`s correspondentes em vez de nomes de clientes.

### 2. Atualizar as Server Actions para filtrar por `account_id`
Alterar as consultas ao Supabase nos seguintes arquivos para usar `.in('account_id', matchingAccountIds)`:
- `lib/actions/dashboard/get-metrics.ts`
- `lib/actions/marketing-analytics/get-analytics.ts`
- `lib/actions/alertas/generate-alerts.ts`

### 3. Garantir Conversão Numérica nas Agregações
Reforçar a conversão de campos numéricos para evitar erros de concatenação de strings (ex: `0 + "10" = "010"`):
- Usar `parseFloat(String(val || 0))` para `spend`, `revenue`, `conversions_value`.
- Usar `parseInt(String(val || 0), 10)` para `conversions`, `clicks`, `impressions`.

## To-dos
- [ ] id: update-filter-helper content: Atualizar getMatchingClients em filter-helpers.ts para retornar account_id e usar lógica sensível à plataforma.
- [ ] id: update-get-metrics content: Atualizar getDashboardMetrics para filtrar por account_id e garantir conversões numéricas.
- [ ] id: update-get-analytics content: Atualizar getMarketingAnalytics e fetchAnalyticsForPeriod para filtrar por account_id e garantir conversões numéricas.
- [ ] id: update-generate-alerts content: Atualizar generateAlerts para filtrar por account_id e usar a mesma lógica de período anterior.
- [ ] id: final-audit-validation content: Executar validação final cruzada via SQL MCP para garantir que Google e Meta estão sendo filtrados e somados corretamente.
