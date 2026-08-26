import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function GET() {
  const results: Record<string, any> = {};

  // 1. Check env vars
  results.env = {
    hasDbUrl: !!process.env.DATABASE_URL,
    hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
    hasJwtSecret: !!process.env.JWT_SECRET,
    dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...',
  };

  // 2. Check DB connection and tables
  try {
    const db = createClient({
      url: process.env.DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    });

    const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
    results.tables = tables.rows.map(r => r.name);

    // Check each table's row count
    const counts: Record<string, number> = {};
    for (const t of tables.rows) {
      try {
        const c = await db.execute({ sql: `SELECT COUNT(*) as c FROM "${t.name}"`, args: [] });
        counts[t.name as string] = Number(c.rows[0]?.c || 0);
      } catch (e: any) {
        counts[t.name as string] = -1; // error
      }
    }
    results.rowCounts = counts;

    // Test BlogPost query (same as getAllPosts)
    try {
      const r = await db.execute({
        sql: 'SELECT * FROM BlogPost ORDER BY "scheduledAt" DESC LIMIT 3',
        args: [],
      });
      results.blogPostTest = { ok: true, rows: r.rows.length };
    } catch (e: any) {
      results.blogPostTest = { ok: false, error: e.message };
    }

    results.db = 'ok';
  } catch (e: any) {
    results.db = 'error';
    results.dbError = e.message;
  }

  // 3. Check module imports
  try {
    const { sanitizeContent } = await import('@/lib/sanitize');
    results.sanitizeModule = 'ok';
  } catch (e: any) {
    results.sanitizeModule = 'error: ' + e.message;
  }

  try {
    const blogDb = await import('@/lib/blog-db');
    results.blogDbModule = 'ok';
    results.blogDbExports = Object.keys(blogDb).join(', ');
  } catch (e: any) {
    results.blogDbModule = 'error: ' + e.message;
  }

  return NextResponse.json(results);
}
