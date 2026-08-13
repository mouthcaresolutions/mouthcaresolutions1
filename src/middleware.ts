import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Combined middleware:
 * 1. Server-side auth protection for /rajeshark/* (except /rajeshark/login)
 * 2. CSRF protection via Origin/Referer validation for mutating API requests
 */

// Allowed origins for CSRF
const ALLOWED_ORIGINS = [
  'https://mouthcaresolutions.com',
  'https://www.mouthcaresolutions.com',
];

// JWT verification for Edge runtime (no bcrypt dependency)
function verifyJWTEdge(token: string): { username: string; role: string; name: string } | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));

    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { username: payload.username, role: payload.role, name: payload.name };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { method, headers, nextUrl } = request;
  const pathname = nextUrl.pathname;

  // ==================== AUTH PROTECTION FOR ADMIN ROUTES ====================
  const isAdminRoute = pathname.startsWith('/rajeshark');
  const isLoginPage = pathname === '/rajeshark/login';

  if (isAdminRoute && !isLoginPage) {
    // Check for token in cookie or Authorization header
    let token: string | null = null;

    // Check cookie first (preferred)
    const cookieToken = request.cookies.get('admin_token')?.value;
    if (cookieToken) {
      token = cookieToken;
    }

    // Fallback: check Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token || !verifyJWTEdge(token)) {
      // For API routes under /api/admin/*, return 401 JSON
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // For page routes, redirect to login
      const loginUrl = new URL('/rajeshark/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ==================== CSRF PROTECTION FOR MUTATING API REQUESTS ====================
  const isMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  const isApiRoute = pathname.startsWith('/api/');
  const isCron = pathname.startsWith('/api/cron/');

  if (!isMutating || !isApiRoute || isCron) {
    return NextResponse.next();
  }

  const origin = headers.get('origin');
  const referer = headers.get('referer');
  const host = headers.get('host') || '';

  const allowedOrigins = new Set<string>([
    ...ALLOWED_ORIGINS,
    `https://${host}`,
  ]);

  if (origin) {
    if (!allowedOrigins.has(origin)) {
      console.warn(`CSRF blocked: origin=${origin}, path=${pathname}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (!allowedOrigins.has(refererOrigin) && refererOrigin !== `https://${host}`) {
        console.warn(`CSRF blocked: referer=${referer}, path=${pathname}`);
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.next();
    } catch {
      console.warn(`CSRF blocked: invalid referer=${referer}, path=${pathname}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  console.warn(`CSRF blocked: no origin/referer, path=${pathname}`);
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export const config = {
  matcher: ['/rajeshark/:path*', '/api/:path*'],
};
