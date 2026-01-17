import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Garante que o Netlify aplique rewrites mesmo em deploys via CLI/publicação da pasta ".next".
// Sem um "_redirects" no diretório de publish, rotas como "/login" podem virar 404 do Netlify.
const publishDir = join(process.cwd(), '.next')
const redirectsPath = join(publishDir, '_redirects')

mkdirSync(publishDir, { recursive: true })

// Regras mínimas:
// - Mantém otimização de imagem do Netlify para /_next/image (usado pelo Next Image)
// - Fallback geral para o handler do Next no Netlify
const redirects = [
  '/_next/image  /.netlify/images?url=:url&w=:width&q=:quality  200',
  '/_ipx/*  /.netlify/images?url=:url&w=:width&q=:quality  200',
  '/*  /.netlify/functions/___netlify-server-handler  200',
].join('\n') + '\n'

writeFileSync(redirectsPath, redirects, 'utf8')

