import { NextResponse } from 'next/server';

// Rotas que NÃO precisam de login
const PUBLIC_ROUTES = ['/entrar', '/cadastro'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value
    || request.headers.get('authorization')?.replace('Bearer ', '');

  // Deixa rotas públicas passarem
  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r));
  if (isPublic) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/entrar';
  loginUrl.search = '';

  // Rota raiz — redireciona conforme login
  if (pathname === '/') {
    if (!token) return NextResponse.redirect(loginUrl);
    return NextResponse.next();
  }

  // Rotas protegidas — sem token redireciona para login
  if (!token && (pathname.startsWith('/clientee') || pathname.startsWith('/trabalhador'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/entrar';
    url.search = '';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Proteção de modo: rota /trabalhador/* só para workers, /clientee/* só para clients
  // (verificação completa acontece no ContextoAutenticacao no lado do cliente)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
