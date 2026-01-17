# Script Completo para Corrigir e Fazer Deploy no Netlify
# Este script corrige todos os problemas conhecidos e faz o deploy corretamente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Correção Completa do Deploy Netlify" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# 1. Verificar se estamos no diretório correto
Write-Host "1. Verificando diretório do projeto..." -ForegroundColor Yellow
if (-not (Test-Path "package.json")) {
    Write-Host "   [ERRO] package.json nao encontrado!" -ForegroundColor Red
    Write-Host "     Execute este script na raiz do projeto." -ForegroundColor Yellow
    exit 1
}
Write-Host "   [OK] Diretorio correto" -ForegroundColor Green
Write-Host ""

# 2. Verificar e corrigir netlify.toml
Write-Host "2. Verificando netlify.toml..." -ForegroundColor Yellow
$netlifyTomlPath = "netlify.toml"
$netlifyTomlLines = @(
    '[build]',
    '  command = "npm run build"',
    '',
    '[[plugins]]',
    '  package = "@netlify/plugin-nextjs"',
    '',
    '[build.environment]',
    '  NODE_VERSION = "20"',
    '  NPM_FLAGS = "--legacy-peer-deps"'
)
$netlifyTomlContent = $netlifyTomlLines -join "`r`n"

if (Test-Path $netlifyTomlPath) {
    $currentContent = Get-Content $netlifyTomlPath -Raw
    if ($currentContent.Trim() -ne $netlifyTomlContent.Trim()) {
        Write-Host "   [AVISO] Corrigindo netlify.toml..." -ForegroundColor Yellow
        $netlifyTomlContent | Out-File -FilePath $netlifyTomlPath -Encoding UTF8 -NoNewline
        Write-Host "   [OK] netlify.toml corrigido" -ForegroundColor Green
    } else {
        Write-Host "   [OK] netlify.toml esta correto" -ForegroundColor Green
    }
} else {
    Write-Host "   [AVISO] Criando netlify.toml..." -ForegroundColor Yellow
    $netlifyTomlContent | Out-File -FilePath $netlifyTomlPath -Encoding UTF8 -NoNewline
    Write-Host "   [OK] netlify.toml criado" -ForegroundColor Green
}
Write-Host ""

# 3. Verificar plugin Next.js
Write-Host "3. Verificando plugin Next.js..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$hasPlugin = $false

if ($packageJson.devDependencies.'@netlify/plugin-nextjs') {
    Write-Host "   [OK] Plugin instalado: $($packageJson.devDependencies.'@netlify/plugin-nextjs')" -ForegroundColor Green
    $hasPlugin = $true
} elseif ($packageJson.dependencies.'@netlify/plugin-nextjs') {
    Write-Host "   ✓ Plugin instalado: $($packageJson.dependencies.'@netlify/plugin-nextjs')" -ForegroundColor Green
    $hasPlugin = $true
} else {
    Write-Host "   [AVISO] Instalando plugin Next.js..." -ForegroundColor Yellow
    npm install --save-dev @netlify/plugin-nextjs
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Plugin instalado!" -ForegroundColor Green
        $hasPlugin = $true
    } else {
        Write-Host "   [ERRO] Erro ao instalar plugin" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# 4. Verificar Git
Write-Host "4. Verificando repositório Git..." -ForegroundColor Yellow
$gitInstalled = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitInstalled) {
    Write-Host "   ✗ ERRO: Git não encontrado!" -ForegroundColor Red
    Write-Host "     Instale o Git: https://git-scm.com/downloads" -ForegroundColor Yellow
    exit 1
}

$isGitRepo = Test-Path ".git"
if (-not $isGitRepo) {
    Write-Host "   [AVISO] Inicializando repositorio Git..." -ForegroundColor Yellow
    git init
    Write-Host "   [OK] Repositorio Git inicializado" -ForegroundColor Green
}

$remote = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   [AVISO] Nenhum remote configurado" -ForegroundColor Yellow
    Write-Host "     Configure com: git remote add origin <URL>" -ForegroundColor Cyan
} else {
    Write-Host "   [OK] Remote configurado: $remote" -ForegroundColor Green
}
Write-Host ""

# 5. Verificar mudanças não commitadas
Write-Host "5. Verificando mudanças não commitadas..." -ForegroundColor Yellow
$gitStatus = git status --porcelain 2>&1
if ($gitStatus) {
    Write-Host "   ⚠ Encontradas mudanças não commitadas:" -ForegroundColor Yellow
    $gitStatus | ForEach-Object { Write-Host "     $_" -ForegroundColor Gray }
    Write-Host ""
    $commitChanges = Read-Host "   Deseja fazer commit das mudanças? (S/N)"
    if ($commitChanges -eq "S" -or $commitChanges -eq "s") {
        Write-Host "   Adicionando arquivos..." -ForegroundColor Yellow
        git add netlify.toml package.json package-lock.json
        if (Test-Path "CORRIGIR_DEPLOY_COMPLETO.ps1") {
            git add CORRIGIR_DEPLOY_COMPLETO.ps1
        }
        if (Test-Path "CORRIGIR_DEPLOY_NETLIFY.md") {
            git add CORRIGIR_DEPLOY_NETLIFY.md
        }
        if (Test-Path "SOLUCAO_BUILD_SKIPPED.md") {
            git add SOLUCAO_BUILD_SKIPPED.md
        }
        if (Test-Path "diagnostico-build-netlify.ps1") {
            git add diagnostico-build-netlify.ps1
        }
        
        $commitMessage = Read-Host "   Digite a mensagem do commit (ou Enter para padrão)"
        if ([string]::IsNullOrWhiteSpace($commitMessage)) {
            $commitMessage = "Corrigir configuração de deploy no Netlify"
        }
        
        git commit -m $commitMessage
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Mudancas commitadas" -ForegroundColor Green
        } else {
            Write-Host "   [ERRO] Erro ao fazer commit" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ✓ Nenhuma mudança pendente" -ForegroundColor Green
}
Write-Host ""

# 6. Testar build local
Write-Host "6. Testando build local..." -ForegroundColor Yellow
Write-Host "   Executando: npm run build" -ForegroundColor Cyan
Write-Host "   (Isso pode levar alguns minutos...)" -ForegroundColor Yellow
Write-Host ""

$buildOutput = npm run build 2>&1
$buildSuccess = $LASTEXITCODE -eq 0

if ($buildSuccess) {
    Write-Host "   [OK] Build local executado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "   [ERRO] Build local falhou!" -ForegroundColor Red
    Write-Host "   Verifique os erros acima antes de fazer deploy" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Últimas linhas do output:" -ForegroundColor Yellow
    $buildOutput | Select-Object -Last 30 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    Write-Host ""
    Write-Host "   Corrija os erros e execute este script novamente." -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 7. Verificar Netlify CLI
Write-Host "7. Verificando Netlify CLI..." -ForegroundColor Yellow
$netlifyInstalled = Get-Command netlify -ErrorAction SilentlyContinue

if (-not $netlifyInstalled) {
    Write-Host "   ⚠ Netlify CLI não encontrado" -ForegroundColor Yellow
    $installCli = Read-Host "   Deseja instalar o Netlify CLI? (S/N)"
    if ($installCli -eq "S" -or $installCli -eq "s") {
        Write-Host "   Instalando Netlify CLI..." -ForegroundColor Yellow
        npm install -g netlify-cli
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Netlify CLI instalado!" -ForegroundColor Green
        } else {
            Write-Host "   [ERRO] Erro ao instalar Netlify CLI" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   [OK] Netlify CLI encontrado" -ForegroundColor Green
    
    # Verificar autenticação
    $netlifyStatus = netlify status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   [AVISO] Nao autenticado no Netlify" -ForegroundColor Yellow
        Write-Host "   Execute: netlify login" -ForegroundColor Cyan
    } else {
        Write-Host "   [OK] Autenticado no Netlify" -ForegroundColor Green
    }
}
Write-Host ""

# 8. Resumo e próximos passos
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Resumo e Próximos Passos" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✓ Configurações corrigidas:" -ForegroundColor Green
Write-Host "  - netlify.toml configurado corretamente" -ForegroundColor Gray
Write-Host "  - Plugin Next.js instalado" -ForegroundColor Gray
Write-Host "  - Build local funcionando" -ForegroundColor Gray
Write-Host ""

Write-Host "📋 AÇÕES NECESSÁRIAS NO NETLIFY DASHBOARD:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Acesse: https://app.netlify.com" -ForegroundColor Cyan
Write-Host "2. Vá em Site settings → Build & deploy → Build settings" -ForegroundColor Cyan
Write-Host "3. Configure EXATAMENTE assim:" -ForegroundColor Cyan
Write-Host "   - Build command: npm run build (ou DEIXE VAZIO)" -ForegroundColor White
Write-Host "   - Publish directory: DEIXE VAZIO (NAO coloque .next!)" -ForegroundColor White
Write-Host "   - Node version: 20 (ou DEIXE VAZIO)" -ForegroundColor White
Write-Host ""
Write-Host "4. Vá em Site settings → Environment variables" -ForegroundColor Cyan
Write-Host "5. Adicione estas variáveis:" -ForegroundColor Cyan
Write-Host "   - NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor White
Write-Host "   - NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor White
Write-Host ""
Write-Host "6. Se conectado ao Git, faça push das mudanças:" -ForegroundColor Cyan
Write-Host "   git push origin master" -ForegroundColor White
Write-Host ""
Write-Host "7. No Netlify Dashboard, vá em Deploys" -ForegroundColor Cyan
Write-Host "8. Clique em 'Trigger deploy' → 'Clear cache and deploy site'" -ForegroundColor Cyan
Write-Host ""

Write-Host "📚 Documentação:" -ForegroundColor Yellow
Write-Host "  - CORRIGIR_DEPLOY_NETLIFY.md" -ForegroundColor Gray
Write-Host "  - SOLUCAO_BUILD_SKIPPED.md" -ForegroundColor Gray
Write-Host ""
