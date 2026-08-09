const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const total = await p.blogPost.count();
  const pub = await p.blogPost.count({ where: { status: 'published' } });
  const sch = await p.blogPost.count({ where: { status: 'scheduled' } });
  const drf = await p.blogPost.count({ where: { status: 'draft' } });
  console.log('=== Blog Post Stats ===');
  console.log('Total posts:', total);
  console.log('Published:', pub);
  console.log('Scheduled:', sch);
  console.log('Draft:', drf);
  console.log('');

  const cats = await p.blogPost.groupBy({ by: ['category'], _count: true });
  console.log('=== By Category ===');
  cats.forEach(c => console.log('  ' + c.category + ': ' + c._count));
  console.log('');

  // Sample sitemap URLs
  const BASE = 'https://mouthcaresolutions.com';
  console.log('=== Static Pages in Sitemap ===');
  console.log(BASE + ' (priority: 1.0, weekly)');
  console.log(BASE + '/about (priority: 0.9, monthly)');
  console.log(BASE + '/doctors (priority: 0.8, monthly)');
  console.log(BASE + '/services (priority: 0.9, monthly)');
  console.log(BASE + '/blog (priority: 0.9, daily)');
  console.log(BASE + '/contact (priority: 0.7, monthly)');
  console.log('');

  console.log('=== Sample Blog URLs (first 10) ===');
  const sample = await p.blogPost.findMany({
    where: { status: 'published' },
    select: { slug: true, updatedAt: true },
    orderBy: { scheduledAt: 'desc' },
    take: 10,
  });
  sample.forEach(s => {
    console.log(BASE + '/blog/' + s.slug + ' (lastModified: ' + s.updatedAt.toISOString().split('T')[0] + ')');
  });
  console.log('');
  console.log('... and ' + (pub > 10 ? pub - 10 : 0) + ' more blog URLs');
  console.log('');
  console.log('=== Total Sitemap URLs: ' + (6 + pub) + ' ===');
}

main().catch(e => console.error(e)).finally(() => p.$disconnect());
