const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const BASE = 'https://mouthcaresolutions.com';

async function main() {
  const posts = await p.blogPost.findMany({
    where: { status: 'published' },
    select: { slug: true, updatedAt: true },
    orderBy: { scheduledAt: 'desc' },
  });

  const staticPages = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: '1.0' },
    { url: BASE + '/about', lastModified: new Date(), changeFrequency: 'monthly', priority: '0.9' },
    { url: BASE + '/doctors', lastModified: new Date(), changeFrequency: 'monthly', priority: '0.8' },
    { url: BASE + '/services', lastModified: new Date(), changeFrequency: 'monthly', priority: '0.9' },
    { url: BASE + '/blog', lastModified: new Date(), changeFrequency: 'daily', priority: '0.9' },
    { url: BASE + '/contact', lastModified: new Date(), changeFrequency: 'monthly', priority: '0.7' },
  ];

  const blogPages = posts.slice(0, 5000).map(post => ({
    url: BASE + '/blog/' + post.slug,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly',
    priority: '0.7',
  }));

  const all = [...staticPages, ...blogPages];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  all.forEach(page => {
    xml += '  <url>\n';
    xml += '    <loc>' + page.url + '</loc>\n';
    xml += '    <lastmod>' + page.lastModified.toISOString().split('T')[0] + '</lastmod>\n';
    xml += '    <changefreq>' + page.changeFrequency + '</changefreq>\n';
    xml += '    <priority>' + page.priority + '</priority>\n';
    xml += '  </url>\n';
  });
  xml += '</urlset>';

  console.log(xml);
}

main().catch(e => console.error(e)).finally(() => p.$disconnect());
