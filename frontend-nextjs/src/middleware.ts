import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Middleware adicional pode ser adicionado aqui
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Permitir acesso às rotas públicas
        if (req.nextUrl.pathname === '/' || 
            req.nextUrl.pathname === '/login' ||
            req.nextUrl.pathname.startsWith('/api/auth/')) {
          return true
        }
        
        // Verificar se o usuário está autenticado para rotas protegidas
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
