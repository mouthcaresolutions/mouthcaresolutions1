import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalPosts, publishedPosts, draftPosts, postsByCategory, recentPosts, recentWeekPosts, autoBloggerConfig] =
      await Promise.all([
        db.blogPost.count(),
        db.blogPost.count({ where: { status: 'published' } }),
        db.blogPost.count({ where: { status: 'draft' } }),
        db.blogPost.groupBy({ by: ['category'], where: { status: 'published' }, _count: { category: true } }),
        db.blogPost.findMany({ where: { status: 'published' }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, category: true, createdAt: true, scheduledAt: true } }),
        db.blogPost.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
        db.autoBloggerConfig.findFirst(),
      ]);

    return NextResponse.json({ totalPosts, publishedPosts, draftPosts, postsByCategory, recentPosts, recentWeekPosts, autoBloggerConfig });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
