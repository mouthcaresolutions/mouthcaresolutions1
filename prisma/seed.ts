import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'

async function main() {
  const dbUrl = process.env.DATABASE_URL || '';
  const directUrl = process.env.DIRECT_DATABASE_URL || dbUrl;

  const libsql = createClient({
    url: directUrl || dbUrl,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });

  const adapter = new PrismaLibSQL(libsql as any);
  const prisma = new PrismaClient({ adapter } as any);

  // Seed admin user only if ADMIN_PASSWORD is provided
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  
  const count = await prisma.adminUser.count();
  if (count === 0 && adminPassword) {
    await prisma.adminUser.create({
      data: {
        username: adminUsername,
        passwordHash: bcrypt.hashSync(adminPassword, 12),
        name: 'Admin',
        role: 'admin',
      },
    });
    console.log('Admin user created:', adminUsername);
  } else if (count === 0) {
    console.log('WARNING: Set ADMIN_PASSWORD env var to seed admin user');
  } else {
    console.log('Admin user already exists');
  }

  // Seed auto-blogger config
  const configCount = await prisma.autoBloggerConfig.count();
  if (configCount === 0) {
    await prisma.autoBloggerConfig.create({
      data: {
        enabled: true,
        postsPerDay: 3,
        categories: 'General Dentistry,Cosmetic Dentistry,Oral Hygiene,Pediatric Dentistry,Implants & Prosthodontics,Orthodontics,Preventive Dental Care',
        status: 'idle',
      },
    });
    console.log('Auto-blogger config created');
  } else {
    console.log('Auto-blogger config already exists');
  }

  await prisma.$disconnect();
}

main()
  .then(() => console.log('Seeding complete!'))
  .catch((e) => { console.error(e); process.exit(1); });
