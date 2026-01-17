# 🔐 Guia de Login - Sistema Tribuzana

## 📋 Usuários Disponíveis no Sistema

Com base na conexão com o Supabase, os seguintes usuários estão cadastrados na tabela `usuarios`:

### Administradores
1. **Alex Tribuzana (Admin)**
   - Email: `alex@tribuzana.com.br`
   - Nível: Admin
   - ID: `b68e0116-4282-4fee-9ce0-00df274dd896`

2. **Miguel Melo**
   - Email: `miguel@tribuzana.com.br`
   - Nível: Admin
   - ID: `6f2c6cb4-8f63-4aa1-bd0f-2f6d4b4f52d3`

3. **Lucas**
   - Email: `lucas@tribuzana.com.br`
   - Nível: Admin
   - ID: `384bfd80-6469-44aa-bec6-8e421e35c2ee`

### Analistas
4. **Alex-Sandro de Souza**
   - Email: `alex-sandro@tribuzana.com.br`
   - Nível: Analista
   - ID: `a847320e-ead2-424c-911b-b3d573c64d1f`

### Gerentes
5. **Gerente Teste 1**
   - Email: `gerente.hotel1@teste.com`
   - Nível: Gerente
   - ID: `615dd8c0-227c-42f3-b053-e24c5d4cbde8`

## 🚪 Como Fazer Login

1. Acesse `http://localhost:3000/login`
2. Digite seu **email** cadastrado no Supabase Auth
3. Digite sua **senha** cadastrada no Supabase Auth
4. Clique em **"Entrar"**

## 🚪 Como Fazer Logout

1. Clique no **avatar** no canto superior direito
2. Clique em **"Sair"** no menu dropdown
3. Você será redirecionado para a página de login

**Se o logout não funcionar:**
- Acesse diretamente: `http://localhost:3000/login`
- Ou limpe o localStorage no console do navegador

## ⚠️ Importante

**Estes usuários precisam estar cadastrados no Supabase Auth** para fazer login. O sistema verifica:
1. Autenticação no Supabase Auth (email/senha)
2. Existência do usuário na tabela `usuarios` com o mesmo ID
3. Usuário deve estar `ativo = true`

## 🔧 Como Criar/Verificar Usuário

Se você precisar criar um usuário de teste:

1. **Criar no Supabase Auth:**
   - Acesse o painel do Supabase
   - Vá em Authentication > Users
   - Crie um novo usuário com email e senha

2. **Criar na tabela usuarios:**
   ```sql
   INSERT INTO usuarios (id, email, nome_completo, nivel_acesso, ativo)
   VALUES (
     'UUID_DO_USUARIO_AUTH',  -- Use o mesmo ID do Supabase Auth
     'seu@email.com',
     'Seu Nome',
     'admin',  -- ou 'analista', 'gerente', 'usuario'
     true
   );
   ```

## 🐛 Problemas Comuns

### "Erro ao fazer login"
- Verifique se o email e senha estão corretos no Supabase Auth
- Verifique se o usuário existe na tabela `usuarios`
- Verifique se o usuário está ativo (`ativo = true`)

### "Usuário não encontrado"
- O ID do usuário no Supabase Auth deve corresponder ao ID na tabela `usuarios`
- Verifique se o usuário foi criado corretamente em ambas as tabelas

### Dashboard não carrega dados
- Verifique se você está autenticado (deve ver seu nome no canto superior direito)
- Verifique se as datas dos filtros estão definidas
- Verifique o console do navegador para erros

## 📝 Notas

- O sistema usa Supabase Auth para autenticação
- A tabela `usuarios` armazena informações adicionais do usuário
- O middleware protege todas as rotas exceto `/login`
