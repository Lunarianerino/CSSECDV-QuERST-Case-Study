import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { AccountType } from "@/models/account";
import { logSecurityEvent } from "@/lib/securityLogger";
import { SecurityEvent } from "@/models/securityLogs";

// Set runtime to nodejs to avoid Edge Runtime compatibility issues with Mongoose
export const runtime = 'nodejs';
// Explicitly define routes that require auth and onboarding
const protectedRoutes = ['/dashboard', '/exam', '/schedule', '/onboarding', '/profile'];
const authPages = ['/login', '/register'];
const adminRoutes = ['/admin']
const tutorOrAdminRoutes = ['/exams', '/students']
const indexRoute = ['/'];
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
  // console.log("Token:")
  // console.log(token);
  const isAuth = !!token;
  const isOnboarded = token?.onboarded;
  const isAuthPage = authPages.includes(pathname);
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isIndexRoute = indexRoute.includes(pathname);
  const isOnboardingPage = pathname === '/onboarding';
  const isAdmin = token?.type === AccountType.ADMIN;
  const isTutor = token?.type === AccountType.TUTOR;
  const isStudent = token?.type === AccountType.STUDENT;
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isTutorOrAdminRoute = tutorOrAdminRoutes.some(route => pathname.startsWith(route));

  // 🏠 Redirect index route to dashboard
  if (isAuth && isIndexRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  // 🚫 Redirect non-admin users trying to access admin routes
  if (!isAdmin && isAdminRoute) {
    fetch(new URL("/api/security-log", request.url), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.SECURITY_LOG_TOKEN ? { "x-log-token": process.env.SECURITY_LOG_TOKEN } : {}),
      },
      body: JSON.stringify({
        event: SecurityEvent.ACCESS_DENIED,
        outcome: "failure",
        userId: token?.id as string,
        resource: pathname,
        message: "Blocked by middleware (non-admin accessing admin route)",
        req: request,
      }),
      keepalive: true,
    }).catch(() => { });

    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 🔒 Redirect unauthenticated users trying to access protected pages
  if (isProtectedRoute && !isAuth) {
    fetch(new URL("/api/security-log", request.url), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.SECURITY_LOG_TOKEN ? { "x-log-token": process.env.SECURITY_LOG_TOKEN } : {}),
      },
      body: JSON.stringify({
        event: SecurityEvent.ACCESS_DENIED,
        outcome: "failure",
        resource: pathname,
        message: "Blocked by middleware (unauthenticated user accessing protected pages)",
        req: request,
      }),
      keepalive: true,
    }).catch(() => { });
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 👤 Redirect authenticated users who aren't onboarded
  if (isAuth && !isOnboarded && !isOnboardingPage) {
    fetch(new URL("/api/security-log", request.url), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.SECURITY_LOG_TOKEN ? { "x-log-token": process.env.SECURITY_LOG_TOKEN } : {}),
      },
      body: JSON.stringify({
        event: SecurityEvent.ACCESS_DENIED,
        outcome: "failure",
        userId: token?.id as string,
        resource: pathname,
        message: "Blocked by middleware (not onboarded user accessing authenticated pages that is not onboarding)",
        req: request,
      }),
      keepalive: true,
    }).catch(() => { });
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // 👤 Redirect authenticated users who are onboarded and trying to access onboarding page
  if (isAuth && isOnboarded && isOnboardingPage) {
    fetch(new URL("/api/security-log", request.url), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.SECURITY_LOG_TOKEN ? { "x-log-token": process.env.SECURITY_LOG_TOKEN } : {}),
      },
      body: JSON.stringify({
        event: SecurityEvent.ACCESS_DENIED,
        outcome: "failure",
        userId: token?.id as string,
        resource: pathname,
        message: "Blocked by middleware (onboarded user accessing onboarding page)",
        req: request,
      }),
      keepalive: true,
    }).catch(() => { });
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 👤 Redirect non-tutor/admin users trying to access tutor/admin routes
  if (isTutorOrAdminRoute && isStudent) {

    fetch(new URL("/api/security-log", request.url), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.SECURITY_LOG_TOKEN ? { "x-log-token": process.env.SECURITY_LOG_TOKEN } : {}),
      },
      body: JSON.stringify({
        event: SecurityEvent.ACCESS_DENIED,
        outcome: "failure",
        userId: token?.id as string,
        resource: pathname,
        message: "Blocked by middleware (non-tutor/admin accessing tutor/admin route)",
        req: request,
      }),
      keepalive: true,
    }).catch(() => { });
    
    return NextResponse.redirect(new URL('/dashboard', request.url));
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
