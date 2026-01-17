# Como Corrigir o Deploy no Netlify - Build Skipped

## ⚠️ Problema

O deploy mostra "Complete" mas as etapas de **Building** e **Deploying** estão sendo **"Skipped"**, resultando em erro 404.

## 🔍 Causa

O Netlify não está executando o build do Next.js. Isso geralmente acontece quando:
1. O diretório de publicação está configurado incorretamente no Dashboard
2. As variáveis de ambiente não estão configuradas
3. O Netlify não detectou o projeto como Next.js

## ✅ Solução Passo a Passo

### Passo 1: Verificar Configurações no Netlify Dashboard

1. Acesse https://app.netlify.com
2. Selecione seu site
3. Vá em **Site settings** → **Build & deploy** → **Build settings**

**IMPORTANTE - Configure assim:**

- **Build command:** `npm run build` (ou deixe **VAZIO** para usar o `netlify.toml`)
- **Publish directory:** **DEIXE VAZIO** ⚠️ (NÃO coloque `.next` aqui!)
- **Node version:** `20` (ou deixe vazio para usar o do `netlify.toml`)

**Por que deixar o Publish directory vazio?**
O plugin `@netlify/plugin-nextjs` gerencia isso automaticamente. Se você especificar manualmente, pode causar conflitos.

### Passo 2: Verificar Variáveis de Ambiente

1. No Netlify Dashboard, vá em **Site settings** → **Environment variables**
2. Verifique se estas variáveis estão configuradas:

```
NEXT_PUBLIC_SUPABASE_URL=https://hatciwhpzmyidatpiezk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdGNpd2hwem15aWRhdHBpZXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDczMDAsImV4cCI6MjA3NTYyMzMwMH0.4gHLRQPAsh08ECaLUxMdSHIvegOXcAv4a_WMFmrJ_qU
```

3. Se não estiverem, adicione-as e clique em **Save**

### Passo 3: Limpar Cache e Fazer Novo Deploy

1. No Netlify Dashboard, vá em **Deploys**
2. Clique em **Trigger deploy** → **Clear cache and deploy site**
3. Isso forçará um build completo do zero

### Passo 4: Verificar os Logs

1. Após iniciar o deploy, clique nele para ver os detalhes
2. Clique em **Deploy log**
3. Verifique se agora aparece:
   - ✅ **Building** (não mais "Skipped")
   - ✅ **Deploying** (não mais "Skipped")

Se ainda estiver "Skipped", veja os erros acima dessas etapas.

## 🛠️ Diagnóstico Local

Execute o script de diagnóstico antes de fazer deploy:

```powershell
.\diagnostico-build-netlify.ps1
```

Este script vai:
- Verificar se o `netlify.toml` está correto
- Verificar se o plugin Next.js está instalado
- Testar o build localmente
- Verificar variáveis de ambiente

## 📋 Checklist Rápido

Antes de fazer deploy, verifique:

- [ ] `netlify.toml` está na raiz do projeto
- [ ] Plugin `@netlify/plugin-nextjs` está no `package.json`
- [ ] Build local funciona: `npm run build`
- [ ] **Publish directory está VAZIO** no Netlify Dashboard
- [ ] Variáveis de ambiente estão configuradas
- [ ] Node version está como `20`

## 🚀 Deploy Manual via CLI (Alternativa)

Se o Dashboard não funcionar, use a CLI:

```powershell
# 1. Instalar Netlify CLI (se não tiver)
npm install -g netlify-cli

# 2. Fazer login
netlify login

# 3. Configurar variáveis (se necessário)
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://hatciwhpzmyidatpiezk.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "sua_chave_aqui"

# 4. Fazer deploy com build explícito
netlify deploy --prod --build
```

## ❓ Problemas Comuns

### "Build Skipped" continua aparecendo

1. Verifique se o **Publish directory está realmente VAZIO** no Dashboard
2. Verifique se há erros nos logs ANTES da etapa de Building
3. Tente remover e recriar o site no Netlify

### Build falha com erro de variáveis

1. Verifique se as variáveis estão configuradas corretamente
2. Certifique-se de que não há espaços extras nos nomes
3. Faça um novo deploy após adicionar as variáveis

### Site funciona mas mostra 404

1. Verifique se o build foi executado (não deve estar "Skipped")
2. Verifique se há erros no console do navegador
3. Verifique se o middleware não está bloqueando rotas

## 📚 Documentação

- [Netlify Next.js Plugin](https://docs.netlify.com/integrations/frameworks/nextjs/)
- [Netlify Build Settings](https://docs.netlify.com/configure-builds/overview/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## 💡 Dica Final

O problema mais comum é ter o **Publish directory** configurado como `.next` no Dashboard. 
**SEMPRE deixe vazio** quando usar o plugin Next.js oficial!
