import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
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
      prisma.blogPost.findMany({
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
      prisma.blogPost.count({ where }),
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
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
