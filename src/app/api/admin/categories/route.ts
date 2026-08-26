import { NextRequest, NextResponse } from 'next/server';
import * as blogDb from '@/lib/blog-db';
import { verifyJWT } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyJWT(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await blogDb.getAllCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Categories error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
