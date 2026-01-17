# Script de Deploy para Netlify
# Este script ajuda a fazer o deploy do projeto no Netlify

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploy no Netlify - Marketing Analytics" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o Netlify CLI está instalado
Write-Host "Verificando Netlify CLI..." -ForegroundColor Yellow
$netlifyInstalled = Get-Command netlify -ErrorAction SilentlyContinue

if (-not $netlifyInstalled) {
    Write-Host "Netlify CLI não encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g netlify-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro ao instalar Netlify CLI. Tente manualmente: npm install -g netlify-cli" -ForegroundColor Red
        exit 1
    }
    Write-Host "Netlify CLI instalado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Netlify CLI encontrado!" -ForegroundColor Green
}

Write-Host ""

# Verificar se está logado
Write-Host "Verificando autenticação..." -ForegroundColor Yellow
$netlifyStatus = netlify status 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Você precisa fazer login no Netlify primeiro." -ForegroundColor Yellow
    Write-Host "Executando login..." -ForegroundColor Yellow
    netlify login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro ao fazer login. Tente manualmente: netlify login" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Verificar se o site já está inicializado
$netlifyConfig = Test-Path ".netlify"
if (-not $netlifyConfig) {
    Write-Host "Site não inicializado. Inicializando..." -ForegroundColor Yellow
    Write-Host "Siga as instruções na tela:" -ForegroundColor Yellow
    Write-Host "  - Escolha 'Create & configure a new site'" -ForegroundColor Cyan
    Write-Host "  - Escolha um nome ou deixe em branco" -ForegroundColor Cyan
    Write-Host "  - Build command: npm run build" -ForegroundColor Cyan
    Write-Host "  - Publish directory: .next (ou deixe em branco)" -ForegroundColor Cyan
    Write-Host ""
    netlify init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro ao inicializar o site." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Site já inicializado!" -ForegroundColor Green
}

Write-Host ""

# Verificar variáveis de ambiente
Write-Host "Verificando variáveis de ambiente..." -ForegroundColor Yellow
$envVars = netlify env:list 2>&1

if ($envVars -notmatch "NEXT_PUBLIC_SUPABASE_URL") {
    Write-Host "Variáveis de ambiente não configuradas!" -ForegroundColor Yellow
    Write-Host "Configurando variáveis de ambiente..." -ForegroundColor Yellow
    Write-Host ""
    
    $supabaseUrl = Read-Host "Digite a URL do Supabase (ou pressione Enter para usar a padrão)"
    if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
        $supabaseUrl = "https://hatciwhpzmyidatpiezk.supabase.co"
    }
    
    $supabaseKey = Read-Host "Digite a chave anon do Supabase (ou pressione Enter para usar a padrão)"
    if ([string]::IsNullOrWhiteSpace($supabaseKey)) {
        $supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdGNpd2hwem15aWRhdHBpZXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDczMDAsImV4cCI6MjA3NTYyMzMwMH0.4gHLRQPAsh08ECaLUxMdSHIvegOXcAv4a_WMFmrJ_qU"
    }
    
    netlify env:set NEXT_PUBLIC_SUPABASE_URL $supabaseUrl
    netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY $supabaseKey
    
    Write-Host "Variáveis de ambiente configuradas!" -ForegroundColor Green
} else {
    Write-Host "Variáveis de ambiente já configuradas!" -ForegroundColor Green
}

Write-Host ""

# Perguntar se quer fazer deploy de produção ou preview
Write-Host "Escolha o tipo de deploy:" -ForegroundColor Yellow
Write-Host "1. Preview (teste)" -ForegroundColor Cyan
Write-Host "2. Produção" -ForegroundColor Cyan
$deployType = Read-Host "Digite 1 ou 2 (padrão: 1)"

if ($deployType -eq "2") {
    Write-Host ""
    Write-Host "Fazendo deploy de PRODUÇÃO..." -ForegroundColor Yellow
    Write-Host "Isso pode levar alguns minutos..." -ForegroundColor Yellow
    Write-Host ""
    netlify deploy --prod
} else {
    Write-Host ""
    Write-Host "Fazendo deploy de PREVIEW..." -ForegroundColor Yellow
    Write-Host "Isso pode levar alguns minutos..." -ForegroundColor Yellow
    Write-Host ""
    netlify deploy
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para ver o status do site, execute: netlify status" -ForegroundColor Cyan
    Write-Host "Para abrir o site, execute: netlify open:site" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  Erro no deploy!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifique os logs acima para mais detalhes." -ForegroundColor Yellow
    exit 1
}
