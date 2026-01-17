# Como Executar o Script CORRIGIR_DEPLOY_COMPLETO.ps1

## 🚀 Método 1: PowerShell (Recomendado)

### Passo 1: Abrir o PowerShell

1. Pressione `Windows + X` e escolha **"Windows PowerShell"** ou **"Terminal"**
2. Ou pressione `Windows + R`, digite `powershell` e pressione Enter
3. Ou procure por "PowerShell" no menu Iniciar

### Passo 2: Navegar até o Diretório do Projeto

No PowerShell, execute:

```powershell
cd "c:\Users\atend\OneDrive\Documents\Cursor Tribuzana\marketing-analytics"
```

Ou se você já estiver no diretório correto, pode pular este passo.

### Passo 3: Verificar Política de Execução (Se Necessário)

Se você receber um erro sobre política de execução, execute primeiro:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Isso permite executar scripts locais. Você pode precisar confirmar com `S` (Sim).

### Passo 4: Executar o Script

Execute o script com um dos métodos abaixo:

**Opção A - Executar diretamente:**
```powershell
.\CORRIGIR_DEPLOY_COMPLETO.ps1
```

**Opção B - Executar com caminho completo:**
```powershell
& "c:\Users\atend\OneDrive\Documents\Cursor Tribuzana\marketing-analytics\CORRIGIR_DEPLOY_COMPLETO.ps1"
```

## 🖱️ Método 2: Pelo Explorador de Arquivos

### Passo 1: Abrir o Diretório

1. Abra o Explorador de Arquivos
2. Navegue até: `c:\Users\atend\OneDrive\Documents\Cursor Tribuzana\marketing-analytics`

### Passo 2: Executar o Script

**Opção A - Clique com botão direito:**
1. Clique com o botão direito em `CORRIGIR_DEPLOY_COMPLETO.ps1`
2. Escolha **"Executar com PowerShell"**

**Opção B - Shift + Clique direito:**
1. Segure `Shift` e clique com o botão direito no arquivo
2. Escolha **"Abrir janela do PowerShell aqui"**
3. Depois execute: `.\CORRIGIR_DEPLOY_COMPLETO.ps1`

## 🔧 Método 3: Pelo VS Code / Cursor

Se você estiver usando VS Code ou Cursor:

1. Abra o terminal integrado (`Ctrl + '` ou Terminal → New Terminal)
2. Certifique-se de que está no diretório correto
3. Execute:
```powershell
.\CORRIGIR_DEPLOY_COMPLETO.ps1
```

## ⚠️ Solução de Problemas

### Erro: "Não é possível carregar o arquivo porque a execução de scripts está desabilitada"

**Solução:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Depois execute o script novamente.

### Erro: "O termo '.\CORRIGIR_DEPLOY_COMPLETO.ps1' não é reconhecido"

**Solução:**
- Certifique-se de estar no diretório correto
- Use o caminho completo ou verifique se o arquivo existe:
```powershell
Test-Path ".\CORRIGIR_DEPLOY_COMPLETO.ps1"
```

### Erro: "Acesso negado"

**Solução:**
- Execute o PowerShell como Administrador
- Ou verifique as permissões do arquivo

## 📋 O Que o Script Faz

Quando executado, o script vai:

1. ✅ Verificar se está no diretório correto
2. ✅ Verificar e corrigir `netlify.toml`
3. ✅ Verificar se o plugin Next.js está instalado
4. ✅ Verificar configuração do Git
5. ✅ Oferecer para fazer commit das mudanças
6. ✅ Testar o build local (`npm run build`)
7. ✅ Verificar Netlify CLI
8. ✅ Fornecer instruções finais para o Dashboard

## 💡 Dica

Se você quiser ver o que o script faz antes de executar, pode abrir o arquivo em um editor de texto para ler o código.

## 🎯 Próximos Passos Após Executar

Após executar o script com sucesso:

1. Siga as instruções que aparecerem na tela
2. Configure o Netlify Dashboard conforme indicado
3. Faça push das mudanças para o Git (se solicitado)
4. Dispare um novo deploy no Netlify

---

**Comando rápido para copiar e colar:**

```powershell
cd "c:\Users\atend\OneDrive\Documents\Cursor Tribuzana\marketing-analytics"; .\CORRIGIR_DEPLOY_COMPLETO.ps1
```
