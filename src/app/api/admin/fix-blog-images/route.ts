import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { fetchBlogImage, prependImageToContent, extractImageFromContent } from '@/lib/fetch-blog-image';

/**
 * One-time POST endpoint to fix old blog posts that are missing images.
 * Finds all published posts without <img> in content, fetches a unique
 * Pexels/Pixabay image per topic, and prepends it to the content.
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all published posts without images
    const allPosts = await db.blogPost.findMany({
      where: { status: 'published' },
      select: { id: true, title: true, category: true, content: true },
      orderBy: { scheduledAt: 'desc' },
    });

    const needsFix = allPosts.filter(p => !extractImageFromContent(p.content));

    if (needsFix.length === 0) {
      return NextResponse.json({ message: 'All posts already have images', fixed: 0, total: allPosts.length });
    }

    let fixed = 0;
    const errors: string[] = [];

    // Process in batches of 3 to avoid rate limits
    for (let i = 0; i < needsFix.length; i += 3) {
      const batch = needsFix.slice(i, i + 3);
      await Promise.all(
        batch.map(async (post) => {
          try {
            const imageUrl = await fetchBlogImage(post.category, post.title, post.category);
            const updatedContent = prependImageToContent(post.content, imageUrl, post.title);
            await db.blogPost.update({
              where: { id: post.id },
              data: { content: updatedContent },
            });
            fixed++;
          } catch (err) {
            errors.push(`${post.title}: ${err}`);
          }
        })
      );
      // Small delay between batches to respect rate limits
      if (i + 3 < needsFix.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    return NextResponse.json({
      message: `Fixed ${fixed} of ${needsFix.length} posts`,
      fixed,
      total: allPosts.length,
      neededFix: needsFix.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Fix blog images error:', error);
    return NextResponse.json({ error: 'Failed to fix images' }, { status: 500 });
  }
}

// Also support GET for easy browser access (still requires auth via query param)
export async function GET(request: NextRequest) {
  // Convert GET to POST internally for browser convenience
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
    || new URL(request.url).searchParams.get('token') || '';

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized. Pass ?token=YOUR_JWT or use POST with Authorization header' }, { status: 401 });
  }

  // Create a fake request with the token
  const fakeRequest = new NextRequest(request.url, {
    headers: { authorization: `Bearer ${token}` },
  });
  return POST(fakeRequest);
}
