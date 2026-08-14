import { db } from '@/lib/db';
import type { Metadata } from 'next';
import BlogDetailContent from './BlogDetailContent';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.blogPost.findFirst({
    where: { slug, status: 'published' },
    select: { title: true, metaTitle: true, metaDesc: true, excerpt: true, category: true, keywords: true, scheduledAt: true, content: true },
  });
  if (!post) return { title: 'Article Not Found' };

  const title = post.metaTitle || post.title;
  const description = post.metaDesc || post.excerpt || '';
  const imageUrl = post.content?.match(/<img\s+[^>]*src=["']([^"']+)["']/i)?.[1] || '/mcs-logo.jpg';

  return {
    title,
    description: description.substring(0, 160),
    keywords: post.keywords?.split(',').map(k => k.trim()).filter(Boolean) || [],
    openGraph: {
      title,
      description: description.substring(0, 160),
      type: 'article',
      publishedTime: post.scheduledAt?.toISOString(),
      url: `https://mouthcaresolutions.com/blog/${slug}`,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description.substring(0, 160),
    },
    alternates: { canonical: `https://mouthcaresolutions.com/blog/${slug}` },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await db.blogPost.findFirst({
    where: { slug, status: 'published' },
    select: { title: true, metaDesc: true, excerpt: true, scheduledAt: true },
  });

  const articleSchema = post
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.metaDesc || post.excerpt,
        author: { "@type": "Organization", name: "Mouth Care Solutions" },
        publisher: { "@type": "Organization", name: "Mouth Care Solutions", logo: { "@type": "ImageObject", url: "https://mouthcaresolutions.com/mcs-logo.jpg" } },
        datePublished: post.scheduledAt,
        mainEntityOfPage: `https://mouthcaresolutions.com/blog/${slug}`,
      }
    : null;

  return (
    <>
      {articleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      )}
      <BlogDetailContent />
    </>
  );
}
