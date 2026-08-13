import { NextRequest, NextResponse } from 'next/server';

/**
 * CSRF protection via Origin/Referer validation.
 * Only validates mutating requests (POST, PUT, DELETE, PATCH) to API routes.
 * GET requests and non-API routes are not checked.
 */
export function middleware(request: NextRequest) {
  const { method, headers, nextUrl } = request;
  const isMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  const isApiRoute = nextUrl.pathname.startsWith('/api/');
  // Skip cron endpoint — authenticated via CRON_SECRET header
  const isCron = nextUrl.pathname.startsWith('/api/cron/');

  if (!isMutating || !isApiRoute || isCron) {
    return NextResponse.next();
  }

  const origin = headers.get('origin');
  const referer = headers.get('referer');

  // Build allowed origins from request host
  const host = headers.get('host') || '';
  const allowedOrigins = new Set<string>([
    // Production
    'https://mouthcaresolutions.com',
    'https://www.mouthcaresolutions.com',
    // Vercel preview
    `https://${host}`,
  ]);

  // Check Origin header first (sent by fetch/XMLHttpRequest)
  if (origin) {
    if (!allowedOrigins.has(origin)) {
      console.warn(`CSRF blocked: origin=${origin}, path=${nextUrl.pathname}`);
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // Fallback: check Referer header (sent by browsers on form submissions)
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (!allowedOrigins.has(refererOrigin) && refererOrigin !== `https://${host}`) {
        console.warn(`CSRF blocked: referer=${referer}, path=${nextUrl.pathname}`);
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
      return NextResponse.next();
    } catch {
      // Invalid referer URL
      console.warn(`CSRF blocked: invalid referer=${referer}, path=${nextUrl.pathname}`);
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
  }

  // No origin or referer on a mutating API request — block it
  console.warn(`CSRF blocked: no origin/referer, path=${nextUrl.pathname}`);
  return NextResponse.json(
    { error: 'Forbidden' },
    { status: 403 }
  );
}

export const config = {
  matcher: '/api/:path*',
};
