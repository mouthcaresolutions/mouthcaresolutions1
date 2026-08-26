import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import * as blogDb from '@/lib/blog-db';
import { fetchBlogImage, prependImageToContent, extractImageFromContent } from '@/lib/fetch-blog-image';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyJWT(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { posts: allPosts } = await blogDb.getAllPosts(1, 500, '', 'published', '');
    const needsFix = allPosts.filter((p: any) => !extractImageFromContent(p.content));

    if (needsFix.length === 0) {
      return NextResponse.json({ message: 'All posts already have images', fixed: 0, total: allPosts.length });
    }

    let fixed = 0;
    const errors: string[] = [];

    for (let i = 0; i < needsFix.length; i += 3) {
      const batch = needsFix.slice(i, i + 3);
      await Promise.all(
        batch.map(async (post: any) => {
          try {
            const imageUrl = await fetchBlogImage(post.category, post.title, post.category);
            const updatedContent = prependImageToContent(post.content, imageUrl, post.title);
            await blogDb.updateBlogPost(post.id, { content: updatedContent });
            fixed++;
          } catch (err) {
            errors.push(`${post.title}: ${err}`);
          }
        })
      );
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

export async function GET() {
  // SEC-H03 FIX: Only accept POST with Authorization header.
  // GET with ?token= query string is removed (tokens logged in access logs, browser history, Referer).
  return NextResponse.json(
    { error: 'Use POST method with Authorization header' },
    { status: 405 },
  );
}
