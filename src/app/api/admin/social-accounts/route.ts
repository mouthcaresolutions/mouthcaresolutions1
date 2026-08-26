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

// ==================== SUPPORTED PLATFORMS ====================

const SUPPORTED_PLATFORMS = [
  { id: 'facebook', name: 'Facebook Page', icon: 'facebook', category: 'Social', description: 'Post to your Facebook Page', authType: 'oauth', docsUrl: 'https://developers.facebook.com/docs/' },
  { id: 'instagram', name: 'Instagram Business', icon: 'instagram', category: 'Social', description: 'Post to Instagram via Facebook Graph API', authType: 'oauth', docsUrl: 'https://developers.facebook.com/docs/instagram-api/' },
  { id: 'twitter', name: 'Twitter/X', icon: 'twitter', category: 'Social', description: 'Post tweets automatically', authType: 'oauth2', docsUrl: 'https://developer.twitter.com/en/docs' },
  { id: 'linkedin', name: 'LinkedIn Page', icon: 'linkedin', category: 'Social', description: 'Post to your LinkedIn Company Page', authType: 'oauth2', docsUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing/integrations/api' },
  { id: 'whatsapp', name: 'WhatsApp Business', icon: 'whatsapp', category: 'Messaging', description: 'Share blog links via WhatsApp', authType: 'api_key', docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/' },
  { id: 'google_business', name: 'Google Business Profile', icon: 'google', category: 'Business', description: 'Post updates to your Google Business Profile', authType: 'oauth2', docsUrl: 'https://developers.google.com/my-business/' },
];

const PLATFORM_CREDENTIALS: Record<string, { key: string; label: string; placeholder: string; type?: string; required?: boolean }[]> = {
  facebook: [
    { key: 'accessToken', label: 'Page Access Token', placeholder: 'EAAxxxxx...', type: 'password', required: true },
    { key: 'pageId', label: 'Facebook Page ID', placeholder: 'e.g., 123456789012345', required: true },
  ],
  instagram: [
    { key: 'accessToken', label: 'Access Token (from Facebook)', placeholder: 'EAAxxxxx... (same as Facebook token)', type: 'password', required: true },
    { key: 'accountId', label: 'Instagram Business Account ID', placeholder: 'e.g., 17841400123456789', required: true },
  ],
  twitter: [
    { key: 'accessToken', label: 'Twitter API Bearer Token', placeholder: 'AAAAAAAAxxxxxx...', type: 'password', required: true },
  ],
  linkedin: [
    { key: 'accessToken', label: 'LinkedIn Access Token', placeholder: 'AQVxxxxx...', type: 'password', required: true },
    { key: 'accountId', label: 'LinkedIn Person ID (urn:li:person:XXXXX)', placeholder: 'e.g., ABC123xyz (just the ID part)', required: true },
  ],
  whatsapp: [],
  google_business: [
    { key: 'accessToken', label: 'Google OAuth2 Access Token', placeholder: 'ya29.xxxxx...', type: 'password', required: true },
    { key: 'accountId', label: 'Google Account ID', placeholder: 'e.g., 123456789', required: true },
    { key: 'pageId', label: 'Location ID', placeholder: 'e.g., locations/12345678901234567890', required: true },
  ],
};

const PLATFORM_SETUP_GUIDES: Record<string, string> = {
  facebook:
    '1. Go to developers.facebook.com → My Apps → Your App\n' +
    '2. Add "Facebook Login" and "Pages" products\n' +
    '3. Under Permissions, add: pages_manage_posts, pages_read_engagement\n' +
    '4. Generate a Page Access Token with pages_manage_posts permission\n' +
    '5. Paste the token and your Page ID above',
  instagram:
    '1. Your Instagram must be a Business/Creator account linked to a Facebook Page\n' +
    '2. Use the same Facebook Page Access Token as above\n' +
    '3. Get your Instagram Business Account ID from Facebook Graph API Explorer:\n' +
    '   GET /{page-id}?fields=instagram_business_account\n' +
    '4. Add content_publishing permission to your token\n' +
    '5. Paste the token and Account ID above',
  twitter:
    '1. Go to developer.twitter.com → Create Project & App\n' +
    '2. Set User authentication settings (OAuth 2.0)\n' +
    '3. Go to Keys and Tokens → Generate Bearer Token\n' +
    '4. For posting tweets, you need OAuth 1.0a credentials\n' +
    '5. Paste the Bearer Token above',
  linkedin:
    '1. Go to developer.linkedin.com → Create App\n' +
    '2. Add "Share on LinkedIn" and "Sign In with LinkedIn" products\n' +
    '3. Request r_liteprofile, r_emailprofile, w_member_social permissions\n' +
    '4. Get OAuth 2.0 Access Token (3-legged for posting)\n' +
    '5. Get your Person ID from: https://api.linkedin.com/v2/me\n' +
    '6. Paste token and Person ID above',
  whatsapp:
    'WhatsApp does not support automated posting via API. Blog posts will generate shareable WhatsApp links that you can use in your WhatsApp Status, Groups, or broadcast lists.',
  google_business:
    '1. Go to console.cloud.google.com → Create Project\n' +
    '2. Enable "Google My Business API"\n' +
    '3. Create OAuth 2.0 credentials\n' +
    '4. Add scope: https://www.googleapis.com/auth/business.manage\n' +
    '5. Get access token, Account ID, and Location ID from Google Business Profile\n' +
    '6. Paste all three values above',
};

// ==================== HELPERS ====================

async function seedSocialConfigs() {
  for (const platform of SUPPORTED_PLATFORMS) {
    const existing = await blogDb.getSocialConfig(platform.id);
    if (!existing) {
      await blogDb.createSocialConfig(platform.id);
    }
  }
}

// ==================== GET ====================

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('admin_token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await seedSocialConfigs();
    const configs = await blogDb.getAllSocialConfigs();
    const configMap = new Map(configs.map((c: any) => [c.platform, c]));

    const platforms = SUPPORTED_PLATFORMS.map((p) => {
      const stored = configMap.get(p.id) as any;
      const isConnected = stored?.enabled && !!stored?.accessToken;
      return {
        ...p,
        credentials: PLATFORM_CREDENTIALS[p.id] || [],
        setupGuide: PLATFORM_SETUP_GUIDES[p.id] || '',
        status: isConnected ? 'connected' : 'not_connected',
        enabled: stored?.enabled || false,
        lastPostedAt: stored?.lastPostedAt || null,
        totalPosts: stored?.totalPosts || 0,
        lastError: stored?.lastError || null,
        hasToken: !!stored?.accessToken,
      };
    });

    return NextResponse.json({ platforms });
  } catch (error) {
    console.error('Social accounts GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch social accounts' }, { status: 500 });
  }
}

// ==================== POST ====================

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('admin_token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, platform } = body;

    const validPlatform = SUPPORTED_PLATFORMS.find((p) => p.id === platform);
    if (!validPlatform) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    await seedSocialConfigs();

    // Save API credentials for a platform
    if (action === 'saveTokens') {
      const { accessToken, refreshToken, pageId, accountId, extraConfig } = body;

      const updateData: Record<string, any> = {};
      if (accessToken !== undefined) updateData.accessToken = accessToken;
      if (refreshToken !== undefined) updateData.refreshToken = refreshToken;
      if (pageId !== undefined) updateData.pageId = pageId;
      if (accountId !== undefined) updateData.accountId = accountId;
      if (extraConfig !== undefined) {
        updateData.extraConfig = typeof extraConfig === 'string' ? extraConfig : JSON.stringify(extraConfig);
      }

      // Auto-enable when tokens are saved
      if (accessToken) updateData.enabled = 1;

      await blogDb.updateSocialConfig(platform, updateData);

      return NextResponse.json({
        success: true,
        platform,
        status: accessToken ? 'connected' : 'not_connected',
      });
    }

    // Toggle platform enabled/disabled
    if (action === 'toggleEnabled') {
      const { enabled } = body;
      await blogDb.updateSocialConfig(platform, { enabled: enabled ? 1 : 0 });
      return NextResponse.json({ success: true, platform, enabled });
    }

    // Clear credentials (disconnect)
    if (action === 'disconnect') {
      await blogDb.updateSocialConfig(platform, {
        enabled: 0,
        accessToken: null,
        refreshToken: null,
        pageId: null,
        accountId: null,
        lastError: null,
      });

      return NextResponse.json({ success: true, platform, status: 'not_connected' });
    }

    return NextResponse.json({ error: 'Invalid action. Use: saveTokens, toggleEnabled, disconnect' }, { status: 400 });
  } catch (error) {
    console.error('Social accounts POST error:', error);
    return NextResponse.json({ error: 'Failed to update social account' }, { status: 500 });
  }
}
