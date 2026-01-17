# Solução: Build Skipped no Netlify

## Problema Identificado

O deploy no Netlify está mostrando "Complete" mas as etapas de **Building** e **Deploying** estão sendo **"Skipped" (Ignoradas)**, resultando em erro 404 "Page not found".

## Causa Raiz

Quando o build é ignorado, o Netlify não executa o processo de build do Next.js, então os arquivos estáticos necessários não são criados ou deployados.

## Soluções

### 1. Verificar Configurações no Netlify Dashboard

Acesse o painel do Netlify e verifique:

1. **Site settings** → **Build & deploy** → **Build settings**
   - **Build command:** Deve estar como `npm run build` (ou vazio para usar o `netlify.toml`)
   - **Publish directory:** Deve estar **VAZIO** (o plugin Next.js gerencia isso)
   - **Node version:** Deve estar como `20` ou vazio (usa o do `netlify.toml`)

2. **Site settings** → **Environment variables**
   - Verifique se as variáveis estão configuradas:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Forçar um Novo Deploy

1. No Netlify Dashboard, vá em **Deploys**
2. Clique em **Trigger deploy** → **Deploy site**
3. Isso forçará um novo build completo

### 3. Verificar Logs do Deploy

1. Acesse o deploy que falhou
2. Clique em **Deploy log**
3. Procure por erros antes da etapa de "Building"
4. Erros comuns:
   - Variáveis de ambiente não encontradas
   - Erro ao instalar dependências
   - Erro no `package.json`

### 4. Testar Build Localmente

Execute localmente para garantir que o build funciona:

```bash
npm install
npm run build
```

Se o build local falhar, corrija os erros antes de fazer deploy.

### 5. Verificar Configuração do Repositório

Se estiver usando Git:

1. Certifique-se de que o `netlify.toml` está commitado
2. Certifique-se de que o `package.json` está correto
3. Faça push das alterações:
   ```bash
   git add netlify.toml
   git commit -m "Corrigir configuração Netlify"
   git push
   ```

### 6. Limpar Cache do Netlify

1. No Netlify Dashboard, vá em **Deploys**
2. Clique em **Trigger deploy** → **Clear cache and deploy site**

### 7. Verificar Plugin Next.js

O plugin `@netlify/plugin-nextjs` deve estar instalado. Verifique no `package.json`:

```json
"devDependencies": {
  "@netlify/plugin-nextjs": "^5.15.5"
}
```

Se não estiver, instale:

```bash
npm install --save-dev @netlify/plugin-nextjs
```

## Configuração Correta do netlify.toml

O arquivo `netlify.toml` deve estar assim:

```toml
[build]
  command = "npm run build"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--legacy-peer-deps"
```

**IMPORTANTE:** Não especifique `publish` quando usar o plugin Next.js - ele gerencia isso automaticamente.

## Checklist de Verificação

- [ ] `netlify.toml` está na raiz do projeto
- [ ] Plugin `@netlify/plugin-nextjs` está instalado
- [ ] Variáveis de ambiente estão configuradas no Netlify
- [ ] Build local funciona (`npm run build`)
- [ ] Não há erros nos logs do deploy
- [ ] Publish directory está **VAZIO** nas configurações do Netlify
- [ ] Node version está configurada como `20`

## Próximos Passos

1. Verifique todas as configurações acima
2. Faça um novo deploy forçado
3. Verifique os logs do deploy
4. Se ainda não funcionar, verifique se há erros específicos nos logs

## Contato

Se o problema persistir após seguir todos os passos:
1. Copie os logs completos do deploy
2. Verifique se há erros específicos
3. Consulte a documentação: https://docs.netlify.com/integrations/frameworks/nextjs/
