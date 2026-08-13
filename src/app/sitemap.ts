import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

// Force dynamic rendering — sitemap needs live blog data
export const dynamic = 'force-dynamic';

const BASE_URL = 'https://mouthcaresolutions.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/doctors`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/services`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];

  // Try to fetch blog posts for sitemap, gracefully degrade if DB unavailable
  try {
    const posts = await db.blogPost.findMany({
      where: { status: 'published' },
      select: { slug: true, scheduledAt: true, updatedAt: true },
      orderBy: { scheduledAt: 'desc' },
    });

    const blogPages: MetadataRoute.Sitemap = posts.slice(0, 5000).map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...blogPages];
  } catch {
    // Database unavailable during build — return static pages only
    return staticPages;
  }
}
