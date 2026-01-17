# Conexão com Supabase - Projeto Tribuzana

## 📊 Status da Conexão

✅ **Projeto Conectado**: `hatciwhpzmyidatpiezk`
✅ **Status**: ACTIVE_HEALTHY
✅ **Região**: us-east-2

## 📋 Tabelas Principais Conectadas

### 1. `metricas_ads` (24.445 registros)
- **Período**: 2024-11-01 até 2026-01-16
- **Plataformas**: "Google" e "Meta"
- **Clientes**: "dpny", "grinbergs" (e outros)
- **Uso**: Dashboard principal, Marketing Analytics, Google Ads, Meta Ads

### 2. `hoteis_config` (29 hotéis ativos)
- **Campos principais**: id, nome_hotel, nome_fantasia, cidade, estado, ativo
- **Uso**: Filtros de hotéis, configurações de alertas

### 3. `usuarios` (14 usuários)
- **Campos principais**: id (UUID), email, nome_completo, nivel_acesso, ativo
- **Uso**: Autenticação, permissões

### 4. Outras Tabelas Importantes
- `marketing_performance` (9 registros)
- `metricas_campanhas` (10.000 registros)
- `coletas_reservas` (281.779 registros)
- `alertas_log` (11.641 registros)
- `alertas_config` (320 registros)

## 🔧 Ajustes Realizados

### 1. Tipos TypeScript Atualizados
- Suporte para plataformas "Google" e "Meta" (além de "Google Ads" e "Meta Ads")
- Tipos alinhados com a estrutura real do banco

### 2. Mapeamento de Hotéis
- Criada função `mapHotelToClient()` para mapear nomes de hotéis para o campo `client`
- Normalização de nomes (lowercase, remoção de acentos)
- Mapeamentos específicos conhecidos:
  - "DPNY" → "dpny"
  - "Grínbergs Village Hotel" → "grinbergs"

### 3. Server Actions Atualizadas
- `getDashboardMetrics()` agora suporta ambas as nomenclaturas de plataforma
- Filtro por hotéis usando mapeamento inteligente

## 📝 Notas Importantes

1. **Campo `client` vs `nome_hotel`**: 
   - O campo `client` na tabela `metricas_ads` não corresponde diretamente ao `nome_hotel`
   - Foi implementado mapeamento inteligente para fazer a correspondência

2. **Plataformas**:
   - No banco: "Google" e "Meta"
   - No código: Suporta ambas as nomenclaturas

3. **Filtros**:
   - Os filtros por hotel usam o `nome_hotel` da tabela `hoteis_config`
   - O sistema mapeia automaticamente para o `client` da tabela `metricas_ads`

## ✅ Validação

- [x] Conexão com Supabase estabelecida
- [x] Tabelas principais identificadas
- [x] Tipos TypeScript atualizados
- [x] Mapeamento de hotéis implementado
- [x] Server actions funcionando
- [x] Filtros aplicando corretamente
