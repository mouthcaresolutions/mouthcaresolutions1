---
Task ID: 1
Agent: main
Task: Fix critical security issues and admin login failure

Work Log:
- Diagnosed ROOT CAUSE of login failure: legacy SHA-256 verification in auth route was missing the salt 'MCS@2024Secure'. Old setup scripts used SHA-256(password:salt) but auth route verified with plain SHA-256(password) — they never matched.
- Fixed verifyLegacySHA256() to try both salted and plain formats, then auto-migrate to bcrypt
- Removed hardcoded credentials (admin/admin123, frontoffice/frontoffice123) from login page
- Replaced real Pexels & Pixabay API keys in .env.example with placeholders
- Removed hardcoded Turso DB URL from setup-turso.js and setup-crm-tables.js (now uses process.env.DATABASE_URL)
- Changed setup scripts to use bcryptjs instead of SHA-256 for password hashing
- Fixed frontoffice user creation in setup-crm-tables.js to use bcryptjs + env var for password
- Added server-side auth middleware for /rajeshark/* routes (JWT verification in Edge runtime)
- Added HttpOnly cookie support: login API sets admin_token cookie, logout clears it
- Fixed Vercel build failure: sitemap.ts was creating PrismaClient at build time when DATABASE_URL unavailable
- Made db.ts use Proxy for lazy Prisma client initialization (prevents build-time connection)
- Verified correct Vercel project (mouthcaresolutions1-wzkf) has domain mouthcaresolutions.com and all 7 env vars
- Confirmed deploy succeeded and credentials removed from live site

Stage Summary:
- All 4 CRITICAL security issues from friend's audit are now fixed
- Admin login should work now (SHA-256 salt fix + correct Vercel project confirmed)
- Server-side auth middleware added for /rajeshark/* routes
- HttpOnly cookie session support added
- Build passing and deployed to mouthcaresolutions.com
