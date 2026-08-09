import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import crypto from 'crypto'

const SALT = 'MCS@2024Secure';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`${password}:${SALT}`).digest('hex');
}

async function main() {
  const dbUrl = process.env.DATABASE_URL || '';
  const directUrl = process.env.DIRECT_DATABASE_URL || dbUrl;

  const libsql = createClient({
    url: directUrl || dbUrl,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });

  const adapter = new PrismaLibSQL(libsql);
  const prisma = new PrismaClient({ adapter });

  // Seed admin user
  const count = await prisma.adminUser.count();
  if (count === 0) {
    await prisma.adminUser.create({
      data: {
        username: 'admin',
        passwordHash: hashPassword('admin123'),
        name: 'Admin',
        role: 'admin',
      },
    });
    console.log('✅ Admin user created: admin / admin123');
  } else {
    console.log('ℹ️  Admin user already exists');
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
    console.log('✅ Auto-blogger config created');
  } else {
    console.log('ℹ️  Auto-blogger config already exists');
  }

  await prisma.$disconnect();
}

main()
  .then(() => console.log('🌱 Seeding complete!'))
  .catch((e) => { console.error(e); process.exit(1); });
