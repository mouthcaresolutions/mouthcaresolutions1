import { NextRequest, NextResponse } from 'next/server';
import * as blogDb from '@/lib/blog-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';

    const { posts, total } = await blogDb.getPublishedPosts(page, limit, category, search);

    // Extract thumbnail URLs from content so listing page can show images
    const postsWithImages = posts.map(p => {
      const content = p.content as string || '';
      const imgMatch = content.match(/<img\s+[^>]*src=["']([^"']+)["']/i);
      const thumbUrl = imgMatch?.[1] || null;
      const { content: _c, ...rest } = p;
      return { ...rest, thumbUrl };
    });

    return NextResponse.json({
      posts: postsWithImages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Blog API error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
