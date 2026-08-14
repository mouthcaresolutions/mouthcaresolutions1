import { MetadataRoute } from 'next';
import * as blogDb from '@/lib/blog-db';

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

  try {
    const posts = await blogDb.getPublishedPostSlugs(5000);
    const blogPages: MetadataRoute.Sitemap = posts.map((post: any) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt ? new Date(String(post.updatedAt)) : (post.scheduledAt ? new Date(String(post.scheduledAt)) : new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...blogPages];
  } catch {
    return staticPages;
  }
}
