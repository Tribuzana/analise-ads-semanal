# Guia para Criar Novo Repositório no GitHub

Este guia explica como criar um novo repositório no GitHub e conectá-lo ao projeto Marketing Analytics.

## Passo 1: Criar Repositório no GitHub

1. **Acesse:** https://github.com/new
2. **Preencha os dados:**
   - **Repository name:** `marketing-analytics` (ou outro nome de sua escolha)
   - **Description:** `Dashboard de Marketing Analytics - Tribuzana`
   - **Visibility:** Escolha `Public` ou `Private`
   - **NÃO marque** "Add a README file"
   - **NÃO marque** "Add .gitignore"
   - **NÃO marque** "Choose a license"
3. **Clique em:** "Create repository"

## Passo 2: Inicializar Git no Projeto Local

Execute os seguintes comandos no PowerShell, dentro do diretório do projeto:

```powershell
# Navegar para o diretório do projeto
cd "c:\Users\atend\OneDrive\Documents\Cursor Tribuzana\marketing-analytics"

# Inicializar repositório Git
git init

# Adicionar todos os arquivos
git add .

# Fazer o primeiro commit
git commit -m "Initial commit: Marketing Analytics Dashboard"
```

## Passo 3: Conectar ao Repositório Remoto

Após criar o repositório no GitHub, você receberá uma URL. Use uma das opções abaixo:

### Opção A: HTTPS (Recomendado)

```powershell
# Substitua SEU_USUARIO pelo seu usuário do GitHub
git remote add origin https://github.com/SEU_USUARIO/marketing-analytics.git

# Renomear branch para main (se necessário)
git branch -M main

# Fazer push
git push -u origin main
```

### Opção B: SSH

```powershell
# Substitua SEU_USUARIO pelo seu usuário do GitHub
git remote add origin git@github.com:SEU_USUARIO/marketing-analytics.git

# Renomear branch para main (se necessário)
git branch -M main

# Fazer push
git push -u origin main
```

## Passo 4: Autenticação

Se usar HTTPS, o GitHub pode solicitar autenticação:
- **Token de acesso pessoal:** Use um Personal Access Token (PAT)
- **GitHub CLI:** Use `gh auth login` se tiver o GitHub CLI instalado

## Script Automatizado

Você também pode usar o script PowerShell abaixo:

```powershell
# Script para criar e conectar repositório
$repoName = Read-Host "Digite o nome do repositório (ex: marketing-analytics)"
$githubUser = Read-Host "Digite seu usuário do GitHub"

# Inicializar Git
git init
git add .
git commit -m "Initial commit: Marketing Analytics Dashboard"

# Adicionar remote
git remote add origin "https://github.com/$githubUser/$repoName.git"

# Renomear branch
git branch -M main

# Push
git push -u origin main
```

## Verificação

Após o push, verifique se funcionou:

```powershell
git remote -v
git status
```

Você deve ver:
- `origin` apontando para seu repositório GitHub
- `Your branch is up to date with 'origin/main'`

## Próximos Passos

Após criar o repositório:

1. ✅ Configure as variáveis de ambiente no Netlify
2. ✅ Conecte o Netlify ao repositório GitHub
3. ✅ Faça o deploy automático

## Troubleshooting

### Erro: "remote origin already exists"

```powershell
# Remover remote existente
git remote remove origin

# Adicionar novamente
git remote add origin https://github.com/SEU_USUARIO/marketing-analytics.git
```

### Erro: "Authentication failed"

1. Crie um Personal Access Token no GitHub:
   - Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token (classic)
   - Selecione escopos: `repo`
   - Use o token como senha ao fazer push

2. Ou configure SSH:
   ```powershell
   # Gerar chave SSH (se ainda não tiver)
   ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
   
   # Adicionar chave ao ssh-agent
   ssh-add ~/.ssh/id_ed25519
   
   # Copiar chave pública e adicionar no GitHub
   cat ~/.ssh/id_ed25519.pub
   ```

### Erro: "branch name 'master' vs 'main'"

```powershell
# Renomear branch local
git branch -M main

# Push novamente
git push -u origin main
```
