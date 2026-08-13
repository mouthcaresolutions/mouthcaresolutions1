import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateSession } from '@/lib/auth';

// CRITICAL FIX #5: Sanitize HTML content to prevent XSS while preserving safe markdown/HTML
function sanitizeContent(content: string): string {
  // Remove dangerous script tags and event handlers
  let sanitized = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')  // onclick=, onload=, etc.
    .replace(/\bon\w+\s*=\s*\S+/gi, '')               // onclick=without-quotes
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object\b[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<form\b[^>]*>.*?<\/form>/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:')
    .replace(/data\s*:\s*text\/html/gi, 'data:blocked');
  return sanitized;
}

// Content length limits
const MAX_TITLE_LENGTH = 300;
const MAX_CONTENT_LENGTH = 100_000;  // 100KB max content
const MAX_EXCERPT_LENGTH = 2000;
const MAX_KEYWORDS_LENGTH = 2000;

async function auth(token: string) {
  const username = await validateSession(token);
  if (!username) return null;
  return username;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await auth(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (status) where.status = status;
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
      }),
      db.blogPost.count({ where }),
    ]);

    return NextResponse.json({ posts, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Admin posts GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await auth(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, excerpt, category, keywords, metaTitle, metaDesc, status, scheduledAt } = body;

    // CRITICAL FIX #5: Validate lengths and sanitize content
    if (!title || !content || !category) {
      return NextResponse.json({ error: 'Title, content, and category are required' }, { status: 400 });
    }
    if (title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json({ error: `Title must be under ${MAX_TITLE_LENGTH} characters` }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: `Content must be under ${MAX_CONTENT_LENGTH} characters` }, { status: 400 });
    }
    if (content.length < 100) {
      return NextResponse.json({ error: 'Content must be at least 100 characters' }, { status: 400 });
    }
    if (excerpt && excerpt.length > MAX_EXCERPT_LENGTH) {
      return NextResponse.json({ error: `Excerpt must be under ${MAX_EXCERPT_LENGTH} characters` }, { status: 400 });
    }
    if (keywords && keywords.length > MAX_KEYWORDS_LENGTH) {
      return NextResponse.json({ error: `Keywords must be under ${MAX_KEYWORDS_LENGTH} characters` }, { status: 400 });
    }

    // Sanitize content to prevent XSS
    const sanitizedContent = sanitizeContent(content);
    const sanitizedExcerpt = excerpt ? sanitizeContent(excerpt) : '';

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36);

    const post = await db.blogPost.create({
      data: {
        slug,
        title: title.substring(0, MAX_TITLE_LENGTH),
        content: sanitizedContent,
        excerpt: sanitizedExcerpt || sanitizedContent.substring(0, 200),
        category,
        keywords: keywords || '',
        metaTitle: (metaTitle || title).substring(0, MAX_TITLE_LENGTH),
        metaDesc: (metaDesc || sanitizedExcerpt || sanitizedContent.substring(0, 160)).substring(0, 160),
        status: status === 'published' ? 'published' : 'draft',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      },
    });

    return NextResponse.json({ post, success: true });
  } catch (error) {
    console.error('Admin posts POST error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await auth(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    // Whitelist allowed fields to prevent mass assignment
    const allowedFields = ['title', 'content', 'excerpt', 'category', 'keywords', 'metaTitle', 'metaDesc', 'status', 'scheduledAt'] as const;
    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Sanitize text fields on update too
        if (field === 'content' || field === 'excerpt') {
          data[field] = sanitizeContent(String(body[field]));
        } else if (field === 'title' || field === 'metaTitle') {
          data[field] = String(body[field]).substring(0, MAX_TITLE_LENGTH);
        } else if (field === 'metaDesc') {
          data[field] = String(body[field]).substring(0, 160);
        } else {
          data[field] = body[field];
        }
      }
    }

    // Convert scheduledAt to Date if provided
    if (data.scheduledAt) {
      data.scheduledAt = new Date(data.scheduledAt as string);
    }

    const post = await db.blogPost.update({
      where: { id },
      data,
    });

    return NextResponse.json({ post, success: true });
  } catch (error) {
    console.error('Admin posts PUT error:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await auth(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    await db.blogPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin posts DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}