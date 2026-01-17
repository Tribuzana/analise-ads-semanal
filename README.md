# Tribuzana Dashboard

Sistema de Marketing Analytics para Hotelaria

## 🚀 Setup Inicial

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com:

```env
NEXT_PUBLIC_SUPABASE_URL=https://hatciwhpzmyidatpiezk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

### 3. Instalar Componentes shadcn/ui

```bash
npx shadcn-ui@latest add button input label card select dialog dropdown-menu avatar badge separator skeleton tabs toast popover calendar sheet table
```

### 4. Executar o Projeto

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
tribuzana-dashboard/
├── app/                    # Next.js App Router
├── components/             # Componentes React
├── contexts/              # Contextos React
├── hooks/                 # Custom Hooks
├── lib/                   # Utilitários e configurações
├── types/                 # TypeScript types
└── middleware.ts          # Next.js middleware
```

## 🛠️ Tecnologias

- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- React Hook Form
- Zod
- date-fns
- Sonner (Toast)
