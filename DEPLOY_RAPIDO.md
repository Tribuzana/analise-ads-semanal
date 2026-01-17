# Deploy Rápido no Netlify

## Opção 1: Via Interface Web (Mais Fácil) ⭐

1. **Acesse:** https://app.netlify.com
2. **Clique em:** "Add new site" → "Import an existing project"
3. **Conecte seu repositório** (GitHub/GitLab/Bitbucket)
4. **Configure as variáveis de ambiente:**
   - Vá em: Site settings → Environment variables
   - Adicione:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://hatciwhpzmyidatpiezk.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdGNpd2hwem15aWRhdHBpZXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDczMDAsImV4cCI6MjA3NTYyMzMwMH0.4gHLRQPAsh08ECaLUxMdSHIvegOXcAv4a_WMFmrJ_qU
     ```
5. **Clique em:** "Deploy site"
6. **Aguarde** o build completar (~2-5 minutos)
7. **Pronto!** Seu site estará online

## Opção 2: Via Script PowerShell (Automático)

Execute no PowerShell:

```powershell
.\deploy-netlify.ps1
```

O script irá:
- ✅ Verificar/instalar Netlify CLI
- ✅ Fazer login (se necessário)
- ✅ Inicializar o site (se necessário)
- ✅ Configurar variáveis de ambiente
- ✅ Fazer o deploy

## Opção 3: Via CLI Manual

```powershell
# 1. Instalar Netlify CLI (se ainda não tiver)
npm install -g netlify-cli

# 2. Fazer login
netlify login

# 3. Inicializar o site (apenas primeira vez)
netlify init

# 4. Configurar variáveis de ambiente
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://hatciwhpzmyidatpiezk.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdGNpd2hwem15aWRhdHBpZXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDczMDAsImV4cCI6MjA3NTYyMzMwMH0.4gHLRQPAsh08ECaLUxMdSHIvegOXcAv4a_WMFmrJ_qU"

# 5. Fazer deploy de produção
netlify deploy --prod
```

## ⚠️ IMPORTANTE

**SEMPRE configure as variáveis de ambiente ANTES do primeiro deploy!**

Sem elas, o site não conseguirá conectar ao Supabase.

## 📚 Documentação Completa

Para mais detalhes, consulte: `GUIA_DEPLOY_NETLIFY.md`

## ✅ Após o Deploy

Teste:
- [ ] Página inicial carrega
- [ ] Login funciona
- [ ] Dashboard exibe dados
- [ ] Navegação funciona

## 🔄 Atualizações Futuras

Qualquer push para o branch principal irá fazer deploy automático!
