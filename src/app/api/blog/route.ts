import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    // HIGH #3 FIX: Bound limit to prevent data dumps
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = { status: 'published' };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { keywords: { contains: search } },
      ];
    }

    const [posts, total] = await Promise.all([
      db.blogPost.findMany({
        where,
        orderBy: { scheduledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          metaTitle: true,
          metaDesc: true,
          excerpt: true,
          category: true,
          keywords: true,
          scheduledAt: true,
          createdAt: true,
          content: true,
        },
      }),
      db.blogPost.count({ where }),
    ]);

    // Extract thumbnail URLs from content so listing page can show images
    const postsWithImages = posts.map(p => {
      const imgMatch = p.content?.match(/<img\s+[^>]*src=["']([^"']+)["']/i);
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
    return NextResponse.json({ error: 'Failed to fetch posts', detail: (error as any)?.message || String(error).substring(0, 200) }, { status: 500 });
  }
}
