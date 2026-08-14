import { NextRequest, NextResponse } from 'next/server';
import * as blogDb from '@/lib/blog-db';
import { validateSession } from '@/lib/auth';
import { postToPlatform, autoShareNewPost, SOCIAL_PLATFORMS } from '@/lib/social-poster';

// Seed default social configs
async function seedSocialConfigs() {
  for (const platform of SOCIAL_PLATFORMS) {
    const existing = await blogDb.getSocialConfig(platform);
    if (!existing) {
      await blogDb.createSocialConfig(platform);
    }
  }
}

// GET: Fetch all social configs + recent logs
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await seedSocialConfigs();

    const configs = await blogDb.getAllSocialConfigs();
    const logs = await blogDb.getRecentSocialLogs(30);

    // Mask tokens for security
    const safeConfigs = configs.map((c: any) => ({
      ...c,
      accessToken: c.accessToken ? `${c.accessToken.substring(0, 10)}...${c.accessToken.substring(c.accessToken.length - 4)}` : null,
      refreshToken: c.refreshToken ? '****' : null,
    }));

    return NextResponse.json({ configs: safeConfigs, logs });
  } catch (error) {
    console.error('Social GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST: Save config, test connection, share post, auto-share
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, platform } = body;

    // Save platform configuration
    if (action === 'saveConfig') {
      const { accessToken, refreshToken, pageId, accountId, enabled, extraConfig } = body;
      if (!platform || !(SOCIAL_PLATFORMS as readonly string[]).includes(platform)) {
        return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
      }
      await seedSocialConfigs();

      const updateData: Record<string, any> = {};
      if (enabled !== undefined) updateData.enabled = enabled ? 1 : 0;
      if (accessToken !== undefined) updateData.accessToken = accessToken;
      if (refreshToken !== undefined) updateData.refreshToken = refreshToken;
      if (pageId !== undefined) updateData.pageId = pageId;
      if (accountId !== undefined) updateData.accountId = accountId;
      if (extraConfig !== undefined) updateData.extraConfig = typeof extraConfig === 'string' ? extraConfig : JSON.stringify(extraConfig);

      await blogDb.updateSocialConfig(platform, updateData);
      return NextResponse.json({ success: true });
    }

    // Test a platform connection
    if (action === 'testConnection') {
      if (!platform) return NextResponse.json({ error: 'Platform required' }, { status: 400 });
      const config = await blogDb.getSocialConfig(platform);
      if (!config?.accessToken) {
        return NextResponse.json({ success: false, error: 'No access token configured' });
      }
      const result = await postToPlatform(platform, 'test', 'Test Post - Mouth Care Solutions', 'Testing social media integration. If you see this, it is working!', 'test-post-mcs', 'MouthCareSolutions, VijayawadaDentist, TestPost');
      return NextResponse.json(result);
    }

    // Post a specific blog article to selected platforms
    if (action === 'sharePost') {
      const { postId, platforms: selectedPlatforms } = body;
      if (!postId) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

      const post = await blogDb.getPostById(postId);
      if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

      const targets = selectedPlatforms || (SOCIAL_PLATFORMS as readonly string[]).filter((p: string) => p !== 'whatsapp');
      const results: Record<string, any> = {};

      for (const p of targets) {
        results[p] = await postToPlatform(p, post.id as string, post.title as string, (post.excerpt as string) || '', post.slug as string, post.keywords as string | null);
      }

      const successCount = Object.values(results).filter((r: any) => r.success).length;
      return NextResponse.json({ success: true, results, shared: successCount, total: targets.length });
    }

    // Auto-share: Share the latest N published posts to all enabled platforms
    if (action === 'autoShare') {
      const { count = 3 } = body;
      const recentPosts = await blogDb.getPublishedPostsForSharing(count);

      if (recentPosts.length === 0) {
        return NextResponse.json({ success: false, error: 'No published posts to share' });
      }

      const results: any[] = [];
      for (const post of recentPosts) {
        const r = await autoShareNewPost(post.id as string, post.title as string, (post.excerpt as string) || '', post.slug as string, post.keywords as string | null);
        results.push({ post: post.title, ...r });
      }

      const successCount = results.reduce((sum: number, r: any) => sum + (r.shared || 0), 0);
      return NextResponse.json({ success: true, shared: successCount, total: results.length, results });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Social POST error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}