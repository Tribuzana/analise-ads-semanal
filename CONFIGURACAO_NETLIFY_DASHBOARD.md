# Configurações Necessárias no Netlify Dashboard

## ⚠️ IMPORTANTE: Configurações Após Limpeza

Após a limpeza dos arquivos de build do Git e correção do `netlify.toml`, você precisa verificar e configurar corretamente o Netlify Dashboard.

## Passo 1: Configurar Build Settings

1. Acesse: https://app.netlify.com
2. Selecione seu site (`metricas-tribuzana`)
3. Vá em **Site settings** → **Build & deploy** → **Build settings**

### Configurações Obrigatórias:

**Build command:**
- Deixe **VAZIO** (o `netlify.toml` já especifica `npm run build`)
- OU configure como: `npm run build`

**Publish directory:**
- **DEIXE COMPLETAMENTE VAZIO** ⚠️⚠️⚠️
- **NÃO** coloque `.next` aqui!
- O plugin `@netlify/plugin-nextjs` gerencia isso automaticamente

**Node version:**
- Configure como: `20`
- OU deixe vazio (o `netlify.toml` já especifica `NODE_VERSION = "20"`)

### Por que deixar o Publish directory vazio?

Quando você usa o plugin `@netlify/plugin-nextjs`, ele gerencia automaticamente:
- O diretório de publicação
- A construção das funções serverless
- O roteamento das páginas

Se você especificar manualmente `.next` como publish directory, o Netlify assume que os arquivos já estão buildados e ignora o processo de build, resultando em erro 404.

## Passo 2: Verificar Environment Variables

1. No Netlify Dashboard, vá em **Site settings** → **Environment variables**
2. Verifique se estas variáveis estão configuradas:

```
NEXT_PUBLIC_SUPABASE_URL=https://hatciwhpzmyidatpiezk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdGNpd2hwem15aWRhdHBpZXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDczMDAsImV4cCI6MjA3NTYyMzMwMH0.4gHLRQPAsh08ECaLUxMdSHIvegOXcAv4a_WMFmrJ_qU
```

3. Se não estiverem, adicione-as e clique em **Save**

## Passo 3: Fazer Push das Mudanças

Se ainda não fez push do commit:

```powershell
git push origin main
```

Ou se sua branch principal for `master`:

```powershell
git push origin master
```

## Passo 4: Limpar Cache e Fazer Novo Deploy

1. No Netlify Dashboard, vá em **Deploys**
2. Clique em **Trigger deploy** → **Clear cache and deploy site**
3. Isso forçará um build completo do zero, garantindo que:
   - O cache antigo seja limpo
   - Um novo build seja executado corretamente
   - Os arquivos sejam deployados na estrutura correta

## Passo 5: Verificar os Logs

Após iniciar o deploy:

1. Clique no deploy para ver os detalhes
2. Clique em **Deploy log**
3. Verifique se agora aparece:
   - ✅ **Building** (não mais "Skipped")
   - ✅ **Deploying** (não mais "Skipped")
   - ✅ Mensagens de sucesso do plugin Next.js

## Resultado Esperado

Após seguir todos os passos:

- ✅ Build será executado corretamente (não mais "Skipped")
- ✅ Deploy será concluído com sucesso
- ✅ Site estará acessível e funcionando
- ✅ Estrutura de deploy estará correta (sem `_next` na raiz)
- ✅ Deploys automáticos do Git funcionarão

## Arquivos Modificados

- ✅ `.netlify/` - Removido do Git (2008 arquivos)
- ✅ `netlify.toml` - Corrigido (removida linha `publish = ".next"`)
- ✅ `.gitignore` - Verificado (já estava correto)

## Troubleshooting

Se ainda houver problemas:

1. **Build ainda sendo "Skipped":**
   - Verifique se o Publish directory está realmente vazio no Dashboard
   - Verifique se o `netlify.toml` não tem mais a linha `publish = ".next"`

2. **Erro 404 após deploy:**
   - Verifique se as variáveis de ambiente estão configuradas
   - Verifique os logs do deploy para erros específicos

3. **Estrutura de deploy ainda incorreta:**
   - Limpe o cache novamente
   - Faça um novo deploy forçado

## Referências

- `netlify.toml` - Configuração do projeto
- `.gitignore` - Arquivos ignorados pelo Git
- Documentação do plugin: https://github.com/netlify/netlify-plugin-nextjs
