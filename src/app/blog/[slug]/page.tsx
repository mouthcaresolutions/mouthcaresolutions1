import * as blogDb from '@/lib/blog-db';
import type { Metadata } from 'next';
import BlogDetailContent from './BlogDetailContent';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await blogDb.getPublishedPostBySlug(slug);
  if (!post) return { title: 'Article Not Found' };

  const title = (post.metaTitle as string) || (post.title as string);
  const excerpt = (post.excerpt as string) || '';
  const metaDesc = (post.metaDesc as string) || '';
  const description = metaDesc || excerpt;
  const content = (post.content as string) || '';
  const imageUrl = content.match(/<img\s+[^>]*src=["']([^"']+)["']/i)?.[1] || '/mcs-logo.jpg';

  return {
    title,
    description: description.substring(0, 160),
    keywords: (post.keywords as string)?.split(',').map(k => k.trim()).filter(Boolean) || [],
    openGraph: {
      title,
      description: description.substring(0, 160),
      type: 'article',
      publishedTime: post.scheduledAt as string,
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
  const post = await blogDb.getPublishedPostBySlug(slug);

  const articleSchema = post
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: (post.metaDesc as string) || (post.excerpt as string),
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
