# 🔐 Guia de Login e Logout - Sistema Tribuzana

## 📝 Como Fazer Login

### Passo a Passo

1. **Acesse a página de login**
   - URL: `http://localhost:3000/login`
   - Ou acesse qualquer página protegida e será redirecionado automaticamente

2. **Informe suas credenciais**
   - **Email:** Seu email cadastrado no Supabase Auth
   - **Senha:** Sua senha cadastrada no Supabase Auth

3. **Clique em "Entrar"**
   - O sistema validará suas credenciais
   - Se correto, você será redirecionado para o dashboard

### ⚠️ Requisitos para Login

Para fazer login com sucesso, você precisa:

1. **Ter uma conta no Supabase Auth**
   - Email e senha devem estar cadastrados no Supabase
   - Acesse: Supabase Dashboard > Authentication > Users

2. **Ter registro na tabela `usuarios`**
   - O ID do usuário no Supabase Auth deve corresponder ao ID na tabela `usuarios`
   - O usuário deve estar com `ativo = true`

3. **Variáveis de ambiente configuradas**
   - O arquivo `.env.local` deve conter:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://hatciwhpzmyidatpiezk.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
     ```

## 🚪 Como Fazer Logout

### Método 1: Menu do Usuário (Recomendado)

1. **Clique no avatar** no canto superior direito
2. **Clique em "Sair"** no menu dropdown
3. Você será redirecionado para a página de login

### Método 2: Acesso Direto (se o menu não funcionar)

1. **Acesse diretamente:** `http://localhost:3000/login`
2. O middleware detectará que você está autenticado e tentará fazer logout automático

### Método 3: Limpar Manualmente (último recurso)

Se o logout não funcionar:

1. **Abra o Console do Navegador** (F12)
2. **Execute no console:**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   window.location.href = '/login'
   ```

## 🔧 Solução de Problemas

### ❌ Erro: "Erro ao fazer logout"

**Causas possíveis:**
- Problema de conexão com Supabase
- Cookies bloqueados
- Sessão expirada

**Soluções:**
1. Verifique sua conexão com a internet
2. Limpe os cookies do navegador
3. Tente acessar diretamente `/login`
4. Use o método 3 acima (limpar manualmente)

### ❌ Erro: "Email ou senha incorretos"

**Soluções:**
1. Verifique se o email está correto
2. Verifique se a senha está correta no Supabase Auth
3. Verifique se o usuário existe na tabela `usuarios`
4. Verifique se o usuário está ativo (`ativo = true`)

### ❌ Erro: "Variáveis de ambiente não configuradas"

**Soluções:**
1. Verifique se o arquivo `.env.local` existe na raiz do projeto
2. Verifique se as variáveis estão corretas
3. **Reinicie o servidor Next.js** (Ctrl+C e depois `npm run dev`)

### ❌ Dashboard não carrega após login

**Soluções:**
1. Verifique se você está autenticado (veja seu nome no canto superior direito)
2. Verifique se as datas dos filtros estão definidas
3. Verifique o console do navegador (F12) para erros
4. Verifique se há dados no período selecionado

## 📋 Usuários de Teste

Para criar um usuário de teste:

### 1. Criar no Supabase Auth

1. Acesse o painel do Supabase
2. Vá em **Authentication > Users**
3. Clique em **Add User**
4. Preencha:
   - Email: `teste@tribuzana.com.br`
   - Password: `senha123`
   - Auto Confirm User: ✅ (marcar)

### 2. Criar na tabela usuarios

Execute no SQL Editor do Supabase:

```sql
-- Primeiro, obtenha o ID do usuário criado no Auth
-- Depois execute:

INSERT INTO usuarios (id, email, nome_completo, nivel_acesso, ativo)
VALUES (
  'ID_DO_USUARIO_AUTH',  -- Substitua pelo ID do usuário do Auth
  'teste@tribuzana.com.br',
  'Usuário Teste',
  'admin',  -- ou 'analista', 'gerente', 'usuario'
  true
);
```

### 3. Fazer Login

- Email: `teste@tribuzana.com.br`
- Senha: `senha123`

## 🔍 Verificar Status da Sessão

Para verificar se você está autenticado:

1. **Visualmente:** Veja se seu nome aparece no canto superior direito
2. **Console do navegador:** Execute:
   ```javascript
   // Verificar sessão atual
   const { createClient } = await import('@/lib/supabase/client')
   const supabase = createClient()
   const { data: { session } } = await supabase.auth.getSession()
   console.log('Sessão:', session)
   ```

## 📞 Suporte

Se os problemas persistirem:

1. Verifique os logs do servidor Next.js
2. Verifique o console do navegador (F12)
3. Verifique as políticas RLS no Supabase
4. Verifique se o projeto Supabase está ativo
