import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import * as blogDb from '@/lib/blog-db';

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
    for (let i = 0; i < signature.length; i++) { result |= signature.charCodeAt(i) ^ expectedSig.charCodeAt(i); }
    if (result !== 0) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { username: payload.username, role: payload.role, name: payload.name };
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
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