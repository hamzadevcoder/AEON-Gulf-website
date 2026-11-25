import { NextResponse, type NextRequest } from 'next/server';

/**
 * First line of defence for /admin: no session cookie → straight to the login page.
 * The session itself (and the user's role) is verified against the database in every admin page and action.
 */
const COOKIES = ['__Host-aeon_session', 'aeon_session'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!COOKIES.some((c) => req.cookies.has(c))) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = pathname === '/admin' ? '' : `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }
  const res = NextResponse.next();
  if (pathname.startsWith('/admin')) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'no-store');
  }
  return res;
}

export const config = { matcher: ['/admin/:path*'] };
