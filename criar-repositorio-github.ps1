# Script para criar e configurar novo repositório Git
# Este script ajuda a inicializar um novo repositório Git e conectá-lo ao GitHub

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Criar Novo Repositório Git" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se já existe um repositório Git
if (Test-Path ".git") {
    Write-Host "⚠️  Repositório Git já existe!" -ForegroundColor Yellow
    $resposta = Read-Host "Deseja remover e criar um novo? (s/N)"
    if ($resposta -eq "s" -or $resposta -eq "S") {
        Write-Host "Removendo repositório Git existente..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force .git
        Write-Host "✅ Repositório removido!" -ForegroundColor Green
    } else {
        Write-Host "Operação cancelada." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Passo 1: Criar repositório no GitHub" -ForegroundColor Yellow
Write-Host "1. Acesse: https://github.com/new" -ForegroundColor Cyan
Write-Host "2. Crie um novo repositório (NÃO adicione README, .gitignore ou license)" -ForegroundColor Cyan
Write-Host "3. Anote o nome do repositório e seu usuário do GitHub" -ForegroundColor Cyan
Write-Host ""

$continuar = Read-Host "Após criar o repositório no GitHub, pressione Enter para continuar"

Write-Host ""
Write-Host "Passo 2: Configurar repositório local" -ForegroundColor Yellow

# Solicitar informações
$repoName = Read-Host "Digite o nome do repositório (ex: marketing-analytics)"
$githubUser = Read-Host "Digite seu usuário do GitHub"

if ([string]::IsNullOrWhiteSpace($repoName) -or [string]::IsNullOrWhiteSpace($githubUser)) {
    Write-Host "❌ Nome do repositório e usuário são obrigatórios!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Inicializando repositório Git..." -ForegroundColor Yellow
git init
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao inicializar repositório Git!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Repositório Git inicializado!" -ForegroundColor Green

Write-Host ""
Write-Host "Adicionando arquivos..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao adicionar arquivos!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivos adicionados!" -ForegroundColor Green

Write-Host ""
Write-Host "Fazendo commit inicial..." -ForegroundColor Yellow
git commit -m "Initial commit: Marketing Analytics Dashboard"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Erro no commit (pode ser devido a hooks). Tentando sem hooks..." -ForegroundColor Yellow
    git commit --no-verify -m "Initial commit: Marketing Analytics Dashboard"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao fazer commit!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Commit realizado!" -ForegroundColor Green

Write-Host ""
Write-Host "Renomeando branch para main..." -ForegroundColor Yellow
git branch -M main
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Branch já está como main ou erro ao renomear" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Adicionando remote origin..." -ForegroundColor Yellow
$remoteUrl = "https://github.com/$githubUser/$repoName.git"

# Verificar se remote já existe
$existingRemote = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  Remote 'origin' já existe: $existingRemote" -ForegroundColor Yellow
    $resposta = Read-Host "Deseja substituir? (s/N)"
    if ($resposta -eq "s" -or $resposta -eq "S") {
        git remote remove origin
        git remote add origin $remoteUrl
    }
} else {
    git remote add origin $remoteUrl
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao adicionar remote!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Remote adicionado: $remoteUrl" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuração concluída!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximo passo: Fazer push para o GitHub" -ForegroundColor Yellow
Write-Host ""
Write-Host "Execute o comando:" -ForegroundColor Cyan
Write-Host "  git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "Se solicitar autenticação:" -ForegroundColor Yellow
Write-Host "  - Use seu Personal Access Token (não sua senha)" -ForegroundColor Cyan
Write-Host "  - Crie um token em: https://github.com/settings/tokens" -ForegroundColor Cyan
Write-Host ""

$fazerPush = Read-Host "Deseja fazer push agora? (s/N)"
if ($fazerPush -eq "s" -or $fazerPush -eq "S") {
    Write-Host ""
    Write-Host "Fazendo push..." -ForegroundColor Yellow
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  ✅ Push realizado com sucesso!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Repositório disponível em:" -ForegroundColor Cyan
        Write-Host "  https://github.com/$githubUser/$repoName" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Erro ao fazer push!" -ForegroundColor Red
        Write-Host "Verifique:" -ForegroundColor Yellow
        Write-Host "  1. Se o repositório foi criado no GitHub" -ForegroundColor Cyan
        Write-Host "  2. Se você tem permissão para fazer push" -ForegroundColor Cyan
        Write-Host "  3. Se está usando um token de acesso válido" -ForegroundColor Cyan
    }
}
