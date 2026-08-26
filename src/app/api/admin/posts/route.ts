import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import * as blogDb from '@/lib/blog-db';
import { checkBodySize } from '@/lib/auth';
import { sanitizeContent } from '@/lib/sanitize';

const MAX_TITLE_LENGTH = 300;
const MAX_CONTENT_LENGTH = 100_000;
const MAX_EXCERPT_LENGTH = 2000;
const MAX_KEYWORDS_LENGTH = 2000;

function verifyToken(token: string | undefined | null): { username: string; role: string; name: string } | null {
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    if (signature.length !== expectedSig.length) return null;
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    if (result !== 0) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { username: payload.username, role: payload.role, name: payload.name };
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const { posts, total } = await blogDb.getAllPosts(page, limit, category, status, search);

    return NextResponse.json({ posts, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Admin posts GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sizeCheck = checkBodySize(request, 500_000);
    if (sizeCheck) return sizeCheck as NextResponse;

    const body = await request.json();
    const { title, content, excerpt, category, keywords, metaTitle, metaDesc, status, scheduledAt } = body;

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

    const sanitizedContent = sanitizeContent(content);
    const sanitizedExcerpt = excerpt ? sanitizeContent(excerpt) : '';

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36);

    const post = await blogDb.createBlogPost({
      slug,
      title: title.substring(0, MAX_TITLE_LENGTH),
      content: sanitizedContent,
      excerpt: sanitizedExcerpt || sanitizedContent.substring(0, 200),
      category,
      keywords: keywords || '',
      metaTitle: (metaTitle || title).substring(0, MAX_TITLE_LENGTH),
      metaDesc: (metaDesc || sanitizedExcerpt || sanitizedContent.substring(0, 160)).substring(0, 160),
      status: status === 'published' ? 'published' : 'draft',
      author: 'Mouth Care Solutions',
      scheduledAt: scheduledAt || new Date().toISOString(),
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
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sizeCheck = checkBodySize(request, 500_000);
    if (sizeCheck) return sizeCheck as NextResponse;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const allowedFields = ['title', 'content', 'excerpt', 'category', 'keywords', 'metaTitle', 'metaDesc', 'status', 'scheduledAt'] as const;
    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
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

    const post = await blogDb.updateBlogPost(id, data);
    return NextResponse.json({ post, success: true });
  } catch (error) {
    console.error('Admin posts PUT error:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    await blogDb.deleteBlogPost(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin posts DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
