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

/** Extract FAQ items from blog content (H2/H3 followed by <p> blocks) */
function extractFaqs(content: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  // Match FAQ sections: headings containing "FAQ" or "question" followed by list items or paragraphs
  const faqSectionRegex = /<(?:h[23])[^>]*>(?:<[^>]*>)*\s*(?:Frequently Asked Questions|FAQs?|Common Questions|Q&A)\s*(?:<[^>]*>)*<\/(?:h[23])>([\s\S]*?)(?=<(?:h[23])[^>]*>|$)/gi;
  const faqMatch = faqSectionRegex.exec(content);
  if (!faqMatch) return faqs;

  const section = faqMatch[1];
  // Extract Q&A pairs from the section
  const qaRegex = /<(?:h[34]|strong|b)[^>]*>(?:<[^>]*>)*\s*([^<]+?)\s*(?:<[^>]*>)*<\/(?:h[34]|strong|b)>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let qaMatch;
  while ((qaMatch = qaRegex.exec(section)) !== null && faqs.length < 10) {
    const q = qaMatch[1].replace(/^\d+[.)]\s*/, '').trim();
    const a = qaMatch[2].replace(/<[^>]*>/g, '').trim();
    if (q.length > 5 && a.length > 10) faqs.push({ question: q, answer: a.substring(0, 500) });
  }
  return faqs;
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await blogDb.getPublishedPostBySlug(slug);

  const schemas: object[] = [];

  if (post) {
    const content = (post.content as string) || '';
    const category = (post.category as string) || 'General Dentistry';

    // Article schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: (post.metaDesc as string) || (post.excerpt as string),
      author: { "@type": "Organization", name: "Mouth Care Solutions" },
      publisher: { "@type": "Organization", name: "Mouth Care Solutions", logo: { "@type": "ImageObject", url: "https://mouthcaresolutions.com/mcs-logo.jpg" } },
      datePublished: post.scheduledAt,
      mainEntityOfPage: `https://mouthcaresolutions.com/blog/${slug}`,
    });

    // BreadcrumbList schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://mouthcaresolutions.com" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://mouthcaresolutions.com/blog" },
        { "@type": "ListItem", position: 3, name: category, item: `https://mouthcaresolutions.com/blog?category=${encodeURIComponent(category)}` },
        { "@type": "ListItem", position: 4, name: post.title as string },
      ],
    });

    // FAQ schema (if FAQ section found in content)
    const faqs = extractFaqs(content);
    if (faqs.length >= 2) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(f => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      });
    }
  }

  return (
    <>
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <BlogDetailContent />
    </>
  );
}
