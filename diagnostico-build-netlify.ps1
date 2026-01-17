# Script de Diagnóstico - Build Skipped no Netlify
# Este script verifica e corrige problemas que causam o build ser ignorado

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Diagnóstico: Build Skipped no Netlify" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar netlify.toml
Write-Host "1. Verificando netlify.toml..." -ForegroundColor Yellow
if (Test-Path "netlify.toml") {
    $netlifyToml = Get-Content "netlify.toml" -Raw
    Write-Host "   ✓ netlify.toml encontrado" -ForegroundColor Green
    
    # Verificar se tem publish directory (não deve ter com plugin Next.js)
    if ($netlifyToml -match "publish\s*=") {
        Write-Host "   ⚠ AVISO: 'publish' encontrado no netlify.toml" -ForegroundColor Yellow
        Write-Host "     O plugin Next.js gerencia isso automaticamente!" -ForegroundColor Yellow
    } else {
        Write-Host "   ✓ Configuração de publish está correta" -ForegroundColor Green
    }
    
    # Verificar se tem o plugin Next.js
    if ($netlifyToml -match "@netlify/plugin-nextjs") {
        Write-Host "   ✓ Plugin Next.js configurado" -ForegroundColor Green
    } else {
        Write-Host "   ✗ ERRO: Plugin Next.js não encontrado!" -ForegroundColor Red
    }
    
    # Verificar comando de build
    if ($netlifyToml -match "command\s*=\s*[\""']npm run build[\""']") {
        Write-Host "   ✓ Comando de build configurado corretamente" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Verifique o comando de build" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✗ ERRO: netlify.toml não encontrado!" -ForegroundColor Red
    Write-Host "     Criando netlify.toml..." -ForegroundColor Yellow
    @"
[build]
  command = "npm run build"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--legacy-peer-deps"
"@ | Out-File -FilePath "netlify.toml" -Encoding UTF8
    Write-Host "     ✓ netlify.toml criado!" -ForegroundColor Green
}

Write-Host ""

# 2. Verificar package.json
Write-Host "2. Verificando package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    Write-Host "   ✓ package.json encontrado" -ForegroundColor Green
    
    # Verificar script de build
    if ($packageJson.scripts.build) {
        Write-Host "   ✓ Script 'build' encontrado: $($packageJson.scripts.build)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ ERRO: Script 'build' não encontrado!" -ForegroundColor Red
    }
    
    # Verificar plugin Next.js
    $hasPlugin = $false
    if ($packageJson.devDependencies.'@netlify/plugin-nextjs') {
        Write-Host "   ✓ Plugin Next.js instalado: $($packageJson.devDependencies.'@netlify/plugin-nextjs')" -ForegroundColor Green
        $hasPlugin = $true
    } elseif ($packageJson.dependencies.'@netlify/plugin-nextjs') {
        Write-Host "   ✓ Plugin Next.js instalado: $($packageJson.dependencies.'@netlify/plugin-nextjs')" -ForegroundColor Green
        $hasPlugin = $true
    } else {
        Write-Host "   ✗ ERRO: Plugin Next.js não encontrado no package.json!" -ForegroundColor Red
        Write-Host "     Instalando plugin..." -ForegroundColor Yellow
        npm install --save-dev @netlify/plugin-nextjs
        if ($LASTEXITCODE -eq 0) {
            Write-Host "     ✓ Plugin instalado!" -ForegroundColor Green
            $hasPlugin = $true
        } else {
            Write-Host "     ✗ Erro ao instalar plugin" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ✗ ERRO: package.json não encontrado!" -ForegroundColor Red
}

Write-Host ""

# 3. Verificar next.config.js
Write-Host "3. Verificando next.config.js..." -ForegroundColor Yellow
if (Test-Path "next.config.js") {
    Write-Host "   ✓ next.config.js encontrado" -ForegroundColor Green
} elseif (Test-Path "next.config.ts") {
    Write-Host "   ✓ next.config.ts encontrado" -ForegroundColor Green
} else {
    Write-Host "   ⚠ AVISO: next.config.js não encontrado (pode ser normal)" -ForegroundColor Yellow
}

Write-Host ""

# 4. Testar build local
Write-Host "4. Testando build local..." -ForegroundColor Yellow
Write-Host "   Executando: npm run build" -ForegroundColor Cyan
Write-Host "   (Isso pode levar alguns minutos...)" -ForegroundColor Yellow
Write-Host ""

$buildOutput = npm run build 2>&1
$buildSuccess = $LASTEXITCODE -eq 0

if ($buildSuccess) {
    Write-Host "   ✓ Build local executado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "   ✗ ERRO: Build local falhou!" -ForegroundColor Red
    Write-Host "   Verifique os erros acima antes de fazer deploy no Netlify" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Últimas linhas do output:" -ForegroundColor Yellow
    $buildOutput | Select-Object -Last 20 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
}

Write-Host ""

# 5. Verificar variáveis de ambiente (se Netlify CLI estiver disponível)
Write-Host "5. Verificando Netlify CLI..." -ForegroundColor Yellow
$netlifyInstalled = Get-Command netlify -ErrorAction SilentlyContinue

if ($netlifyInstalled) {
    Write-Host "   ✓ Netlify CLI encontrado" -ForegroundColor Green
    
    # Verificar se está logado
    $netlifyStatus = netlify status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Autenticado no Netlify" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "   Verificando variáveis de ambiente no Netlify..." -ForegroundColor Yellow
        $envVars = netlify env:list 2>&1
        
        if ($envVars -match "NEXT_PUBLIC_SUPABASE_URL") {
            Write-Host "   ✓ Variável NEXT_PUBLIC_SUPABASE_URL configurada" -ForegroundColor Green
        } else {
            Write-Host "   ⚠ AVISO: Variável NEXT_PUBLIC_SUPABASE_URL não encontrada" -ForegroundColor Yellow
        }
        
        if ($envVars -match "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
            Write-Host "   ✓ Variável NEXT_PUBLIC_SUPABASE_ANON_KEY configurada" -ForegroundColor Green
        } else {
            Write-Host "   ⚠ AVISO: Variável NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrada" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠ AVISO: Não autenticado no Netlify" -ForegroundColor Yellow
        Write-Host "     Execute: netlify login" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ⚠ AVISO: Netlify CLI não instalado" -ForegroundColor Yellow
    Write-Host "     Instale com: npm install -g netlify-cli" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Resumo do Diagnóstico" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($buildSuccess) {
    Write-Host "✓ Build local funciona corretamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Verifique as configurações no Netlify Dashboard:" -ForegroundColor Cyan
    Write-Host "   - Build command: npm run build (ou vazio)" -ForegroundColor Gray
    Write-Host "   - Publish directory: VAZIO (deixe em branco!)" -ForegroundColor Gray
    Write-Host "   - Node version: 20" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Configure as variáveis de ambiente no Netlify:" -ForegroundColor Cyan
    Write-Host "   - NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Gray
    Write-Host "   - NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Faça um novo deploy:" -ForegroundColor Cyan
    Write-Host "   - No Dashboard: Trigger deploy → Clear cache and deploy site" -ForegroundColor Gray
    Write-Host "   - Ou via CLI: netlify deploy --prod --build" -ForegroundColor Gray
} else {
    Write-Host "✗ Build local falhou - corrija os erros antes de fazer deploy" -ForegroundColor Red
}

Write-Host ""
Write-Host "Para mais informações, consulte: SOLUCAO_BUILD_SKIPPED.md" -ForegroundColor Cyan
