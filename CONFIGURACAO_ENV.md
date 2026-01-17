# Configuração de Variáveis de Ambiente

## Arquivo .env.local

O arquivo `.env.local` já existe e contém as seguintes variáveis:

```env
NEXT_PUBLIC_SUPABASE_URL=https://hatciwhpzmyidatpiezk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdGNpd2hwem15aWRhdHBpZXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDczMDAsImV4cCI6MjA3NTYyMzMwMH0.4gHLRQPAsh08ECaLUxMdSHIvegOXcAv4a_WMFmrJ_qU
```

## Verificação da Conexão

### 1. Reiniciar o servidor Next.js

**IMPORTANTE:** Após criar ou modificar o arquivo `.env.local`, você DEVE reiniciar o servidor Next.js:

```bash
# Parar o servidor (Ctrl+C)
# Depois iniciar novamente:
npm run dev
```

### 2. Testar a conexão

Acesse a rota de teste:
```
http://localhost:3000/api/test-connection
```

Isso retornará informações sobre:
- Se as variáveis de ambiente estão carregadas
- Se a conexão com o Supabase está funcionando
- Qualquer erro de conexão

### 3. Verificar no console do navegador

Abra o console do navegador (F12) e verifique se há erros relacionados ao Supabase.

### 4. Verificar logs do servidor

No terminal onde o `npm run dev` está rodando, verifique se há mensagens de erro sobre variáveis de ambiente.

## Problemas Comuns

### Variáveis não carregadas

Se as variáveis não estão sendo carregadas:

1. **Certifique-se de que o arquivo está na raiz do projeto**
   - Deve estar em: `marketing-analytics/.env.local`
   - Não em: `marketing-analytics/app/.env.local`

2. **Verifique se não há espaços extras**
   - Não deve ter espaços antes ou depois do `=`
   - Exemplo correto: `NEXT_PUBLIC_SUPABASE_URL=https://...`
   - Exemplo errado: `NEXT_PUBLIC_SUPABASE_URL = https://...`

3. **Não use aspas nas variáveis**
   - Correto: `NEXT_PUBLIC_SUPABASE_URL=https://...`
   - Errado: `NEXT_PUBLIC_SUPABASE_URL="https://..."`

4. **Reinicie o servidor**
   - O Next.js só carrega variáveis de ambiente na inicialização
   - Pare o servidor (Ctrl+C) e inicie novamente (`npm run dev`)

### Erro de conexão

Se a conexão falhar mesmo com as variáveis corretas:

1. Verifique se o projeto Supabase está ativo
2. Verifique se a chave anon está correta
3. Verifique as políticas RLS (Row Level Security) no Supabase
4. Verifique se o usuário está autenticado (algumas tabelas têm RLS habilitado)

## Estrutura do Arquivo

O arquivo `.env.local` deve ter esta estrutura:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://hatciwhpzmyidatpiezk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui

# Webhook Secret (opcional)
WEBHOOK_SECRET=your-secret-token
```

## Segurança

⚠️ **IMPORTANTE:** 
- O arquivo `.env.local` está no `.gitignore` e NÃO deve ser commitado
- Nunca compartilhe suas chaves do Supabase publicamente
- Use variáveis de ambiente diferentes para desenvolvimento e produção
