import { createClient } from '@libsql/client';

// Direct libsql connection for blog/autoblogger — bypasses Prisma entirely
function getBlogDb() {
  const url = process.env.DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN || undefined;
  if (!url) throw new Error('DATABASE_URL not set');
  return createClient({ url, authToken: token });
}

export async function getAutoBloggerConfig() {
  const db = getBlogDb();
  const result = await db.execute('SELECT * FROM AutoBloggerConfig LIMIT 1');
  return result.rows[0] || null;
}

export async function updateAutoBloggerConfig(id: string, data: Record<string, any>) {
  const db = getBlogDb();
  const sets = Object.entries(data).map(([k, v]) => `"${k}" = ?`).join(', ');
  const values = Object.values(data);
  await db.execute({
    sql: `UPDATE AutoBloggerConfig SET ${sets}, "updatedAt" = datetime('now') WHERE id = ?`,
    args: [...values, id],
  });
}

export async function getAutoBloggerLogs(limit = 20) {
  const db = getBlogDb();
  const result = await db.execute({
    sql: 'SELECT * FROM AutoBloggerLog ORDER BY "ranAt" DESC LIMIT ?',
    args: [limit],
  });
  return result.rows;
}

export async function createAutoBloggerLog(data: {
  status: string;
  postsCreated: number;
  postsFailed: number;
  error?: string | null;
  duration: number;
}) {
  const db = getBlogDb();
  const id = 'log_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  await db.execute({
    sql: 'INSERT INTO AutoBloggerLog (id, status, "postsCreated", "postsFailed", error, duration, "ranAt") VALUES (?, ?, ?, ?, ?, ?, datetime('now'))',
    args: [id, data.status, data.postsCreated, data.postsFailed, data.error || null, data.duration],
  });
}

export async function createBlogPost(data: {
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  metaDesc: string;
  metaTitle: string;
  category: string;
  keywords: string;
  status: string;
  author: string;
  scheduledAt: string;
}) {
  const db = getBlogDb();
  const id = 'bp_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  await db.execute({
    sql: 'INSERT INTO BlogPost (id, slug, title, content, excerpt, "metaDesc", "metaTitle", category, keywords, status, author, "scheduledAt", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))',
    args: [
      id,
      data.slug,
      data.title,
      data.content,
      data.excerpt,
      data.metaDesc,
      data.metaTitle,
      data.category,
      data.keywords,
      data.status,
      data.author,
      data.scheduledAt,
    ],
  });
  return { id, ...data };
}

export async function incrementConfigStats(id: string, generated: number, failed: number, nextRunAt: string) {
  const db = getBlogDb();
  await db.execute({
    sql: 'UPDATE AutoBloggerConfig SET "totalGenerated" = "totalGenerated" + ?, "failedCount" = "failedCount" + ?, "lastRunAt" = datetime('now'), "nextRunAt" = ?, "updatedAt" = datetime('now') WHERE id = ?',
    args: [generated, failed, nextRunAt, id],
  });
}

export async function setConfigStatus(id: string, status: string) {
  const db = getBlogDb();
  if (status === 'running') {
    await db.execute({
      sql: 'UPDATE AutoBloggerConfig SET status = ?, "lastRunAt" = datetime('now'), "updatedAt" = datetime('now') WHERE id = ?',
      args: [status, id],
    });
  } else {
    await db.execute({
      sql: 'UPDATE AutoBloggerConfig SET status = ?, "updatedAt" = datetime('now') WHERE id = ?',
      args: [status, id],
    });
  }
}
