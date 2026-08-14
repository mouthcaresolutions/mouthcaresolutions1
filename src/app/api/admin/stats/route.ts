import { NextRequest, NextResponse } from 'next/server';
import * as blogDb from '@/lib/blog-db';
import { validateSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalPosts, publishedPosts, draftPosts, postsByCategory, recentPosts, recentWeekPosts, autoBloggerConfig] =
      await Promise.all([
        blogDb.getPostCount(),
        blogDb.getPostCount('published'),
        blogDb.getPostCount('draft'),
        blogDb.getPostsByCategoryCount(),
        blogDb.getRecentPosts(5),
        blogDb.getRecentWeekPostCount(),
        blogDb.getAutoBloggerConfig(),
      ]);

    return NextResponse.json({ totalPosts, publishedPosts, draftPosts, postsByCategory, recentPosts, recentWeekPosts, autoBloggerConfig });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}