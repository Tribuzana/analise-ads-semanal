# Guia de Deploy no Netlify

Este guia explica como fazer o deploy do projeto Marketing Analytics no Netlify.

## Pré-requisitos

1. Conta no Netlify (crie em https://app.netlify.com)
2. Projeto no GitHub/GitLab/Bitbucket (recomendado) ou acesso via CLI
3. Variáveis de ambiente do Supabase configuradas

## Método 1: Deploy via Interface Web (Recomendado)

### Passo 1: Preparar o Repositório

Certifique-se de que seu código está commitado e enviado para o GitHub:

```bash
git add .
git commit -m "Preparar para deploy no Netlify"
git push origin main
```

### Passo 2: Conectar o Repositório no Netlify

1. Acesse https://app.netlify.com
2. Clique em **"Add new site"** → **"Import an existing project"**
3. Escolha seu provedor Git (GitHub, GitLab ou Bitbucket)
4. Autorize o Netlify a acessar seus repositórios
5. Selecione o repositório `marketing-analytics`

### Passo 3: Configurar o Build

O Netlify detectará automaticamente as configurações do `netlify.toml`, mas verifique:

- **Build command:** `npm run build` (ou deixe **VAZIO** para usar o `netlify.toml`)
- **Publish directory:** **DEIXE VAZIO** ⚠️ (NÃO coloque `.next` - o plugin Next.js gerencia isso!)
- **Node version:** `20` (ou deixe vazio para usar o do `netlify.toml`)

### Passo 4: Configurar Variáveis de Ambiente

⚠️ **CRÍTICO:** Configure as variáveis de ambiente antes do primeiro deploy!

1. Na página de configuração do site, vá em **"Site settings"** → **"Environment variables"**
2. Adicione as seguintes variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=https://hatciwhpzmyidatpiezk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdGNpd2hwem15aWRhdHBpZXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDczMDAsImV4cCI6MjA3NTYyMzMwMH0.4gHLRQPAsh08ECaLUxMdSHIvegOXcAv4a_WMFmrJ_qU
```

3. Clique em **"Save"**

### Passo 5: Fazer o Deploy

1. Clique em **"Deploy site"**
2. Aguarde o build completar (pode levar 2-5 minutos)
3. Quando concluído, você receberá uma URL como: `https://seu-site.netlify.app`

### Passo 6: Verificar o Deploy

1. Acesse a URL fornecida pelo Netlify
2. Teste o login e funcionalidades principais
3. Verifique os logs em **"Deploys"** → **"Deploy log"** se houver erros

## Método 2: Deploy via CLI

### Passo 1: Instalar Netlify CLI

```bash
npm install -g netlify-cli
```

### Passo 2: Fazer Login

```bash
netlify login
```

Isso abrirá o navegador para autenticação.

### Passo 3: Inicializar o Site

```bash
netlify init
```

Siga as instruções:
- Escolha **"Create & configure a new site"**
- Escolha um nome para o site ou deixe em branco para gerar automaticamente
- Configure o build command: `npm run build`
- Configure o publish directory: **DEIXE VAZIO** (o plugin Next.js gerencia isso automaticamente)

### Passo 4: Configurar Variáveis de Ambiente

```bash
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://hatciwhpzmyidatpiezk.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdGNpd2hwem15aWRhdHBpZXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDczMDAsImV4cCI6MjA3NTYyMzMwMH0.4gHLRQPAsh08ECaLUxMdSHIvegOXcAv4a_WMFmrJ_qU"
```

### Passo 5: Fazer o Deploy

```bash
netlify deploy --prod
```

## Configurações Adicionais

### Domínio Personalizado

1. Vá em **"Site settings"** → **"Domain management"**
2. Clique em **"Add custom domain"**
3. Siga as instruções para configurar DNS

### Configurações de Build

O arquivo `netlify.toml` já está configurado com:
- Plugin Next.js oficial do Netlify
- Node.js versão 20
- Comando de build: `npm run build`
- **IMPORTANTE:** Não especifique diretório de publicação - o plugin Next.js gerencia isso automaticamente!

## Troubleshooting

### Erro: "Build failed"

1. Verifique os logs do deploy no Netlify
2. Certifique-se de que todas as variáveis de ambiente estão configuradas
3. Verifique se o Node.js versão 20 está sendo usado
4. Tente fazer um build local: `npm run build`

### Erro: "Environment variables not found"

1. Verifique se as variáveis foram adicionadas corretamente
2. Certifique-se de que não há espaços extras nos nomes das variáveis
3. Faça um novo deploy após adicionar as variáveis

### Erro: "Supabase connection failed"

1. Verifique se as URLs e chaves do Supabase estão corretas
2. Verifique se o projeto Supabase está ativo
3. Verifique as políticas RLS no Supabase

### Build muito lento

1. O primeiro build pode levar mais tempo (instalação de dependências)
2. Builds subsequentes são mais rápidos (cache de dependências)
3. Considere usar Netlify Build Plugins para otimização

## Atualizações Futuras

Após o deploy inicial, qualquer push para o branch principal (main/master) irá:
1. Disparar um novo deploy automaticamente
2. Criar um preview deploy para pull requests
3. Notificar por email quando o deploy estiver completo

## Verificação Final

Após o deploy, teste:

- [ ] Página inicial carrega corretamente
- [ ] Login funciona
- [ ] Dashboard carrega dados do Supabase
- [ ] Navegação entre páginas funciona
- [ ] Gráficos e métricas são exibidos corretamente

## Suporte

Se encontrar problemas:
1. Verifique os logs do deploy no Netlify
2. Consulte a documentação: https://docs.netlify.com
3. Verifique a documentação do Next.js: https://nextjs.org/docs/deployment
