import { createClient } from '@libsql/client';
import crypto from 'crypto';

// SEC-C03 FIX: Strict column allowlists to prevent SQL injection via column names
const BLOG_POST_COLUMNS = new Set([
  'title', 'content', 'excerpt', 'metaDesc', 'metaTitle',
  'category', 'keywords', 'status', 'author', 'scheduledAt',
]);

const AUTOBLOGGER_CONFIG_COLUMNS = new Set([
  'enabled', 'postsPerDay', 'categories', 'status',
  'totalGenerated', 'failedCount', 'lastRunAt', 'nextRunAt',
]);

const SOCIAL_CONFIG_COLUMNS = new Set([
  'enabled', 'accessToken', 'refreshToken', 'extraConfig',
  'totalPosts', 'lastRefreshedAt',
]);

function filterColumns(data: Record<string, any>, allowed: Set<string>): Record<string, any> {
  const filtered: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (allowed.has(k)) filtered[k] = v;
  }
  return filtered;
}

// SEC-M01 FIX: Use crypto.randomBytes instead of Math.random() for IDs
function generateId(prefix: string): string {
  return prefix + crypto.randomBytes(8).toString('hex') + Date.now().toString(36);
}

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
  // SEC-C03 FIX: Filter columns against allowlist
  const filtered = filterColumns(data, AUTOBLOGGER_CONFIG_COLUMNS);
  if (Object.keys(filtered).length === 0) return;
  const sets = Object.entries(filtered).map(([k, v]) => `"${k}" = ?`).join(', ');
  const values = Object.values(filtered);
  await db.execute({
    sql: `UPDATE AutoBloggerConfig SET ${sets}, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ?`,
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
  const id = generateId('log_');
  await db.execute({
    sql: 'INSERT INTO AutoBloggerLog (id, status, "postsCreated", "postsFailed", error, duration, "ranAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
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
  const id = generateId('bp_');
  await db.execute({
    sql: 'INSERT INTO BlogPost (id, slug, title, content, excerpt, "metaDesc", "metaTitle", category, keywords, status, author, "scheduledAt", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
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
    sql: 'UPDATE AutoBloggerConfig SET "totalGenerated" = "totalGenerated" + ?, "failedCount" = "failedCount" + ?, "lastRunAt" = CURRENT_TIMESTAMP, "nextRunAt" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ?',
    args: [generated, failed, nextRunAt, id],
  });
}

// ---- Public blog queries ----

export async function getPublishedPostSlugs(limit = 5000) {
  const db = getBlogDb();
  const result = await db.execute({
    sql: 'SELECT slug, "updatedAt", "scheduledAt" FROM BlogPost WHERE status = ? ORDER BY "scheduledAt" DESC LIMIT ?',
    args: ['published', limit],
  });
  return result.rows;
}

export async function getPublishedPosts(page: number, limit: number, category: string, search: string) {
  const db = getBlogDb();
  const offset = (page - 1) * limit;
  let whereClause = 'WHERE status = ?';
  const args: any[] = ['published'];

  if (category) {
    whereClause += ' AND category = ?';
    args.push(category);
  }
  if (search) {
    whereClause += ' AND (title LIKE ? OR content LIKE ? OR keywords LIKE ?)';
    const searchPattern = `%${search}%`;
    args.push(searchPattern, searchPattern, searchPattern);
  }

  const [postsResult, countResult] = await Promise.all([
    db.execute({
      // SEC-H07 FIX: Exclude content field from listing queries (prevents mass scraping + reduces payload)
      sql: `SELECT id, slug, title, "metaTitle", "metaDesc", excerpt, category, keywords, "scheduledAt", "createdAt" FROM BlogPost ${whereClause} ORDER BY "scheduledAt" DESC LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    }),
    db.execute({
      sql: `SELECT COUNT(*) as total FROM BlogPost ${whereClause}`,
      args,
    }),
  ]);

  const total = Number(countResult.rows[0]?.total || 0);
  return { posts: postsResult.rows, total };
}

export async function getPublishedPostBySlug(slug: string) {
  const db = getBlogDb();
  const result = await db.execute({
    sql: 'SELECT * FROM BlogPost WHERE slug = ? AND status = ? LIMIT 1',
    args: [slug, 'published'],
  });
  return result.rows[0] || null;
}

// ---- Admin user ----

export async function getAdminUser(username: string) {
  const db = getBlogDb();
  const r = await db.execute({ sql: 'SELECT * FROM AdminUser WHERE username = ? LIMIT 1', args: [username] });
  return r.rows[0] || null;
}

// ---- Admin blog queries ----

export async function getAllPosts(page: number, limit: number, category: string, status: string, search: string) {
  const db = getBlogDb();
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const args: any[] = [];

  if (category) { conditions.push('category = ?'); args.push(category); }
  if (status) { conditions.push('status = ?'); args.push(status); }
  if (search) {
    conditions.push('(title LIKE ? OR content LIKE ? OR keywords LIKE ?)');
    const s = `%${search}%`;
    args.push(s, s, s);
  }
  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const [postsResult, countResult] = await Promise.all([
    db.execute({
      sql: `SELECT * FROM BlogPost ${whereClause} ORDER BY "scheduledAt" DESC LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    }),
    db.execute({
      sql: `SELECT COUNT(*) as total FROM BlogPost ${whereClause}`,
      args,
    }),
  ]);

  return { posts: postsResult.rows, total: Number(countResult.rows[0]?.total || 0) };
}

export async function getPostById(id: string) {
  const db = getBlogDb();
  const result = await db.execute({ sql: 'SELECT * FROM BlogPost WHERE id = ? LIMIT 1', args: [id] });
  return result.rows[0] || null;
}

export async function updateBlogPost(id: string, data: Record<string, any>) {
  const db = getBlogDb();
  // SEC-C03 FIX: Filter columns against allowlist
  const filtered = filterColumns(data, BLOG_POST_COLUMNS);
  if (Object.keys(filtered).length === 0) return getPostById(id);
  const sets = Object.entries(filtered).map(([k, v]) => `"${k}" = ?`).join(', ');
  const values = Object.values(filtered);
  await db.execute({
    sql: `UPDATE BlogPost SET ${sets}, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ?`,
    args: [...values, id],
  });
  return getPostById(id);
}

export async function deleteBlogPost(id: string) {
  const db = getBlogDb();
  await db.execute({ sql: 'DELETE FROM BlogPost WHERE id = ?', args: [id] });
}

export async function getPostCount(whereStatus?: string) {
  const db = getBlogDb();
  if (whereStatus) {
    const r = await db.execute({ sql: 'SELECT COUNT(*) as c FROM BlogPost WHERE status = ?', args: [whereStatus] });
    return Number(r.rows[0]?.c || 0);
  }
  const r = await db.execute('SELECT COUNT(*) as c FROM BlogPost');
  return Number(r.rows[0]?.c || 0);
}

export async function getPostsByCategoryCount() {
  const db = getBlogDb();
  const r = await db.execute({ sql: 'SELECT category, COUNT(*) as count FROM BlogPost WHERE status = ? GROUP BY category ORDER BY count DESC', args: ['published'] });
  return r.rows;
}

export async function getRecentPosts(limit: number) {
  const db = getBlogDb();
  const r = await db.execute({
    sql: 'SELECT id, title, category, "createdAt", "scheduledAt" FROM BlogPost WHERE status = ? ORDER BY "createdAt" DESC LIMIT ?',
    args: ['published', limit],
  });
  return r.rows;
}

export async function getRecentWeekPostCount() {
  const db = getBlogDb();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const r = await db.execute({
    sql: 'SELECT COUNT(*) as c FROM BlogPost WHERE "createdAt" >= ?',
    args: [weekAgo],
  });
  return Number(r.rows[0]?.c || 0);
}

export async function getAllCategories() {
  const db = getBlogDb();
  const r = await db.execute('SELECT category, COUNT(*) as count FROM BlogPost GROUP BY category ORDER BY count DESC');
  return r.rows.map(row => row.category as string);
}

export async function getPublishedPostBySlugAny(slug: string) {
  const db = getBlogDb();
  const r = await db.execute({ sql: 'SELECT * FROM BlogPost WHERE slug = ? LIMIT 1', args: [slug] });
  return r.rows[0] || null;
}

// ---- Social media config queries ----

export async function getSocialConfig(platform: string) {
  const db = getBlogDb();
  const r = await db.execute({ sql: 'SELECT * FROM SocialMediaConfig WHERE platform = ? LIMIT 1', args: [platform] });
  return r.rows[0] || null;
}

export async function getAllSocialConfigs() {
  const db = getBlogDb();
  const r = await db.execute('SELECT * FROM SocialMediaConfig ORDER BY platform ASC');
  return r.rows;
}

export async function createSocialConfig(platform: string) {
  const db = getBlogDb();
  const id = generateId('smc_');
  await db.execute({
    sql: 'INSERT INTO SocialMediaConfig (id, platform, enabled, "totalPosts", "createdAt", "updatedAt") VALUES (?, ?, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    args: [id, platform],
  });
}

export async function updateSocialConfig(platform: string, data: Record<string, any>) {
  const db = getBlogDb();
  // SEC-C03 FIX: Filter columns against allowlist
  const filtered = filterColumns(data, SOCIAL_CONFIG_COLUMNS);
  if (Object.keys(filtered).length === 0) return;
  const sets = Object.entries(filtered).map(([k, v]) => `"${k}" = ?`).join(', ');
  const values = Object.values(filtered);
  await db.execute({
    sql: `UPDATE SocialMediaConfig SET ${sets}, "updatedAt" = CURRENT_TIMESTAMP WHERE platform = ?`,
    args: [...values, platform],
  });
}

export async function getRecentSocialLogs(limit: number) {
  const db = getBlogDb();
  const r = await db.execute({
    sql: 'SELECT * FROM SocialPostLog ORDER BY "postedAt" DESC LIMIT ?',
    args: [limit],
  });
  return r.rows;
}

export async function createSocialPostLog(data: { platform: string; blogPostId?: string; title: string; postUrl?: string; socialPostId?: string; status: string; response?: string }) {
  const db = getBlogDb();
  const id = generateId('spl_');
  await db.execute({
    sql: 'INSERT INTO SocialPostLog (id, platform, "blogPostId", title, "postUrl", "socialPostId", status, response, "postedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
    args: [id, data.platform, data.blogPostId || null, data.title, data.postUrl || null, data.socialPostId || null, data.status, data.response || null],
  });
}

export async function getPublishedPostsForSharing(limit: number) {
  const db = getBlogDb();
  const r = await db.execute({
    sql: 'SELECT * FROM BlogPost WHERE status = ? ORDER BY "createdAt" DESC LIMIT ?',
    args: ['published', limit],
  });
  return r.rows;
}

export async function setConfigStatus(id: string, status: string) {
  const db = getBlogDb();
  if (status === 'running') {
    await db.execute({
      sql: 'UPDATE AutoBloggerConfig SET status = ?, "lastRunAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ?',
      args: [status, id],
    });
  } else {
    await db.execute({
      sql: 'UPDATE AutoBloggerConfig SET status = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ?',
      args: [status, id],
    });
  }
}
