import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    // CRITICAL FIX #1: Only return published posts to public
    const post = await db.blogPost.findFirst({
      where: { slug, status: 'published' },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Blog post API error:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}
