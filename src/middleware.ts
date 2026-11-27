import { NextResponse, type NextRequest } from 'next/server';

/**
 * 1. /admin: no session cookie → straight to the login page (the session itself is checked in every admin page).
 * 2. Languages: English lives at the normal addresses (/about), Arabic under /ar (/ar/about).
 *    English requests are rewritten internally to /en/... so both languages share one set of pages.
 */
const COOKIES = ['__Host-aeon_session', 'aeon_session'];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    if (pathname !== '/admin/login' && !COOKIES.some((c) => req.cookies.has(c))) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = pathname === '/admin' ? '' : `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }

  // /en/... is never shown: send it to the plain address
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || '/';
    return NextResponse.redirect(url, 308);
  }
  if (pathname === '/ar' || pathname.startsWith('/ar/')) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/en${pathname === '/' ? '' : pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  // everything except Next.js internals, API routes, uploads and files with an extension
  matcher: ['/((?!api|_next|uploads|brand|fonts|images|flags|favicon|sitemap.xml|robots.txt|.*\\..*).*)'],
};
