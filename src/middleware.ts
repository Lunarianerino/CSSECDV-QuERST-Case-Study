import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Explicitly define routes that require auth and onboarding
const protectedRoutes = ['/dashboard', '/exams', '/exam'];
const authPages = ['/login', '/register'];
const adminRoutes = ['/admin']
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  console.log("Token:")
  console.log(token);
  const isAuth = !!token;
  const isOnboarded = token?.onboarded;
  const isAuthPage = authPages.includes(pathname);
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isOnboardingPage = pathname === '/onboarding';
  const isAdmin = token?.type === 'admin';
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  // 🚫 Redirect non-admin admin users trying to access admin routes
  if (!isAdmin && isAdminRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 🔒 Redirect unauthenticated users trying to access protected pages
  if (isProtectedRoute && !isAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 👤 Redirect authenticated users who aren't onboarded
  if (isAuth && !isOnboarded && !isOnboardingPage) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // 👋 Prevent authenticated users from accessing login/register again
  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ✅ Allow everything else
  return NextResponse.next();
}

// Match all routes except static/image/etc.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
