const { createClient } = require('@libsql/client');
const crypto = require('crypto');

const SALT = 'MCS@2024Secure';
function hashPassword(password) {
  return crypto.createHash('sha256').update(`${password}:${SALT}`).digest('hex');
}

async function main() {
  const db = createClient({
    url: 'libsql://mcs-dental-mouthcaresolutions.aws-ap-south-1.turso.io',
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log('Creating tables...');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS AdminUser (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS AutoBloggerConfig (
      id TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 1,
      postsPerDay INTEGER NOT NULL DEFAULT 3,
      lastRunAt DATETIME,
      nextRunAt DATETIME,
      categories TEXT NOT NULL DEFAULT 'General Dentistry,Cosmetic Dentistry,Oral Hygiene,Pediatric Dentistry,Implants & Prosthodontics,Orthodontics,Preventive Dental Care',
      status TEXT NOT NULL DEFAULT 'idle',
      totalGenerated INTEGER NOT NULL DEFAULT 0,
      failedCount INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS AutoBloggerLog (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      postsCreated INTEGER NOT NULL DEFAULT 0,
      postsFailed INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      duration INTEGER NOT NULL DEFAULT 0,
      ranAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS SocialMediaConfig (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL UNIQUE,
      enabled INTEGER NOT NULL DEFAULT 0,
      accessToken TEXT,
      refreshToken TEXT,
      pageId TEXT,
      accountId TEXT,
      extraConfig TEXT,
      lastPostedAt DATETIME,
      totalPosts INTEGER NOT NULL DEFAULT 0,
      lastError TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS BlogPost (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      metaTitle TEXT,
      metaDesc TEXT,
      content TEXT NOT NULL,
      excerpt TEXT,
      category TEXT NOT NULL,
      keywords TEXT,
      status TEXT NOT NULL DEFAULT 'published',
      author TEXT NOT NULL DEFAULT 'Mouth Care Solutions',
      scheduledAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS SocialPostLog (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      blogPostId TEXT,
      title TEXT NOT NULL,
      postUrl TEXT,
      socialPostId TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      response TEXT,
      postedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (blogPostId) REFERENCES BlogPost(id)
    );
  `);

  // Create indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_BlogPost_category ON BlogPost(category);',
    'CREATE INDEX IF NOT EXISTS idx_BlogPost_slug ON BlogPost(slug);',
    'CREATE INDEX IF NOT EXISTS idx_BlogPost_scheduledAt ON BlogPost(scheduledAt);',
    'CREATE INDEX IF NOT EXISTS idx_BlogPost_status ON BlogPost(status);',
  ];

  for (const sql of indexes) {
    await db.execute(sql);
  }

  console.log('Tables created successfully!');

  // Seed admin user
  const existing = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM AdminUser',
    args: []
  });

  if (existing.rows[0].count === 0) {
    const id = 'admin_' + crypto.randomBytes(8).toString('hex');
    const passwordHash = hashPassword('admin123');
    await db.execute({
      sql: 'INSERT INTO AdminUser (id, username, passwordHash, name, role) VALUES (?, ?, ?, ?, ?)',
      args: [id, 'admin', passwordHash, 'Admin', 'admin']
    });
    console.log('Admin user created: admin / admin123');
  } else {
    console.log('Admin user already exists');
  }

  // Seed auto-blogger config
  const configExists = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM AutoBloggerConfig',
    args: []
  });

  if (configExists.rows[0].count === 0) {
    const configId = 'config_' + crypto.randomBytes(8).toString('hex');
    await db.execute({
      sql: 'INSERT INTO AutoBloggerConfig (id, enabled, postsPerDay, categories, status) VALUES (?, 1, 3, ?, ?)',
      args: [configId, 'General Dentistry,Cosmetic Dentistry,Oral Hygiene,Pediatric Dentistry,Implants & Prosthodontics,Orthodontics,Preventive Dental Care', 'idle']
    });
    console.log('Auto-blogger config created');
  } else {
    console.log('Auto-blogger config already exists');
  }

  // Verify
  const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
  console.log('\nDatabase tables:');
  tables.rows.forEach(r => console.log('  - ' + r.name));

  console.log('\nDatabase setup complete!');
}

main().catch(e => { console.error(e); process.exit(1); });
