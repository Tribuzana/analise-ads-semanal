import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // #region agent log (H1/H2)
  fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:8',message:'middleware entry',data:{pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion agent log
  
  // Permitir acesso a arquivos estáticos e rotas da API sem autenticação
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Permitir acesso à página de login mesmo sem variáveis configuradas
    if (pathname === '/login') {
      // #region agent log (H1)
      fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:33',message:'no env: allow /login',data:{pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion agent log
      return response
    }
    // Redirecionar para login se não tiver variáveis configuradas
    // #region agent log (H2)
    fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:38',message:'no env: redirect to /login',data:{pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion agent log
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const supabase = createServerClient(
      url,
      key,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isLoginPage = pathname === '/login'
    const isPublicRoute = pathname === '/login'

    // Se não estiver autenticado e tentar acessar rota protegida
    if (!user && !isPublicRoute) {
      // #region agent log (H2)
      fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:98',message:'no user: redirect to /login',data:{pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion agent log
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Se estiver autenticado e tentar acessar login, redirecionar para dashboard
    if (user && isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return response
  } catch (error) {
    // Em caso de erro, permitir acesso à página de login
    console.error('[Middleware] Erro ao verificar autenticação:', error)
    if (pathname === '/login') {
      return response
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
