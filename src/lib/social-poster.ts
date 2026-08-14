import * as blogDb from './blog-db';
import { generateOAuthState } from './oauth-state';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mouthcaresolutions.com';

interface PostContent {
  title: string;
  excerpt: string;
  url: string;
  hashtags: string;
}

interface PostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

// ==================== HELPERS ====================

/** Simple in-memory rate limiter: max `limit` calls per platform per `windowMs` */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(platform: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(platform);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(platform, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

/** Percent-encode per RFC 3986 (OAuth 1.0a compatible) */
function oauthEncode(str: string): string {
  return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A');
}

/** Generate OAuth 1.0a signature for Twitter API v2 */
function generateOAuthSignature(
  method: string,
  url: string,
  oauthParams: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): Promise<string> {
  const allParams = { ...oauthParams };
  const sortedKeys = Object.keys(allParams).sort();
  const paramStr = sortedKeys.map(k => `${oauthEncode(k)}=${oauthEncode(allParams[k])}`).join('&');
  const baseStr = `${method.toUpperCase()}&${oauthEncode(url)}&${oauthEncode(paramStr)}`;
  const signingKey = `${oauthEncode(consumerSecret)}&${oauthEncode(tokenSecret)}`;
  // Base64(HMAC-SHA1)
  const encoder = new TextEncoder();
  const keyData = encoder.encode(signingKey);
  const msgData = encoder.encode(baseStr);
  return crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']).then(async key => {
    const buf = await crypto.subtle.sign('HMAC', key, msgData);
    const arr = new Uint8Array(buf);
    return btoa(String.fromCharCode(...arr));
  });
}

/** Build OAuth 1.0a Authorization header for Twitter */
async function buildTwitterAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessSecret: string
): Promise<string> {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.getRandomValues(new Uint8Array(16)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  };
  const signature = await generateOAuthSignature(method, url, oauthParams, consumerSecret, accessSecret);
  oauthParams['oauth_signature'] = signature;
  return `OAuth ${Object.entries(oauthParams).map(([k, v]) => `${oauthEncode(k)}="${oauthEncode(v)}"`).join(', ')}`;
}

/** Refresh an OAuth access token using a refresh token */
async function refreshOAuthToken(
  platform: string,
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number } | null> {
  try {
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
    };
  } catch {
    return null;
  }
}

/** Check if token needs refresh (assume 1 hour expiry safety margin) */
function needsRefresh(lastRefreshed: string | null, expiresInSeconds?: number): boolean {
  if (!lastRefreshed) return true;
  const elapsed = (Date.now() - new Date(lastRefreshed).getTime()) / 1000;
  const expiry = (expiresInSeconds || 3600) - 3600; // refresh 1hr before actual expiry
  return elapsed > expiry;
}

// ==================== PLATFORM POSTING FUNCTIONS ====================

async function postToFacebook(config: any, postContent: PostContent): Promise<PostResult> {
  try {
    const extraConfig = config.extraConfig ? JSON.parse(config.extraConfig as string) : {};

    // Token refresh if needed
    if (extraConfig.clientId && extraConfig.clientSecret && config.refreshToken) {
      if (needsRefresh(config.lastRefreshedAt, extraConfig.expiresIn)) {
        const newToken = await refreshOAuthToken(
          'facebook',
          'https://graph.facebook.com/v18.0/oauth/access_token',
          extraConfig.clientId,
          extraConfig.clientSecret,
          config.refreshToken as string
        );
        if (newToken) {
          await blogDb.updateSocialConfig('facebook', {
            accessToken: newToken.accessToken,
            refreshToken: newToken.refreshToken,
            lastRefreshedAt: new Date().toISOString(),
          });
          config.accessToken = newToken.accessToken;
        }
      }
    }

    const message = `\ud83d\udc7b ${postContent.title}\n\n${postContent.excerpt?.substring(0, 200) || ''}\n\n\ud83d\udd17 Read more: ${postContent.url}\n\n${postContent.hashtags}\n\n\ud83d\udccd Mouth Care Solutions, Vijayawada`;
    const res = await fetch(`https://graph.facebook.com/v18.0/${config.pageId}/feed`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${config.accessToken}` },
      body: new URLSearchParams({ message, link: postContent.url }),
    });
    const data = await res.json();
    if (data.id) return { success: true, postId: data.id };
    // If token expired error, try refresh
    if (data.error?.code === 190 && extraConfig.clientId) {
      return { success: false, error: `Token expired. Please re-authenticate Facebook.` };
    }
    return { success: false, error: data.error?.message || 'Facebook API error' };
  } catch (e: any) { return { success: false, error: e.message }; }
}

async function postToInstagram(config: any, postContent: PostContent): Promise<PostResult> {
  try {
    const caption = `\ud83d\udc7b ${postContent.title}\n\n${postContent.excerpt?.substring(0, 150) || ''}\n\n\ud83d\udd17 Link in bio\n\n${postContent.hashtags}\n\n\ud83d\udccd Vijayawada`;
    const res = await fetch(`https://graph.facebook.com/v18.0/${config.accountId}/media`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${config.accessToken}` },
      body: new URLSearchParams({ image_url: `${SITE_URL}/mcs-logo.jpg`, caption }),
    });
    const data = await res.json();
    if (data.id) {
      const pubRes = await fetch(`https://graph.facebook.com/v18.0/${config.accountId}/media_publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.accessToken}` },
        body: new URLSearchParams({ creation_id: data.id }),
      });
      const pubData = await pubRes.json();
      if (pubData.id) return { success: true, postId: pubData.id };
      return { success: false, error: pubData.error?.message || 'Instagram publish failed' };
    }
    return { success: false, error: data.error?.message || 'Instagram media creation failed' };
  } catch (e: any) { return { success: false, error: e.message }; }
}

async function postToGoogleBusiness(config: any, postContent: PostContent): Promise<PostResult> {
  try {
    const extraConfig = config.extraConfig ? JSON.parse(config.extraConfig as string) : {};

    // Token refresh for Google
    if (extraConfig.clientId && extraConfig.clientSecret && config.refreshToken) {
      if (needsRefresh(config.lastRefreshedAt, extraConfig.expiresIn)) {
        const newToken = await refreshOAuthToken(
          'google_business',
          'https://oauth2.googleapis.com/token',
          extraConfig.clientId,
          extraConfig.clientSecret,
          config.refreshToken as string
        );
        if (newToken) {
          await blogDb.updateSocialConfig('google_business', {
            accessToken: newToken.accessToken,
            refreshToken: newToken.refreshToken,
            lastRefreshedAt: new Date().toISOString(),
          });
          config.accessToken = newToken.accessToken;
        }
      }
    }

    const summary = postContent.excerpt?.substring(0, 300) || postContent.title;
    const res = await fetch(
      `https://mybusiness.googleapis.com/v4/accounts/${config.accountId}/locations/${config.pageId}/localPosts`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          languageCode: 'en',
          topicType: 'STANDARD',
          summary,
          callToAction: { actionType: 'LEARN_MORE', url: postContent.url },
        }),
      }
    );
    if (res.ok) { const data = await res.json(); return { success: true, postId: data.name }; }
    return { success: false, error: `Google Business API: ${await res.text()}` };
  } catch (e: any) { return { success: false, error: e.message }; }
}

async function postToTwitter(config: any, postContent: PostContent): Promise<PostResult> {
  try {
    const extraConfig = config.extraConfig ? JSON.parse(config.extraConfig as string) : {};
    const consumerKey = extraConfig.consumerKey || extraConfig.apiKey;
    const consumerSecret = extraConfig.consumerSecret || extraConfig.apiKeySecret;
    const accessSecret = extraConfig.accessSecret || config.refreshToken; // reuse refreshToken field for access secret

    if (!consumerKey || !consumerSecret || !accessSecret) {
      return { success: false, error: 'Twitter/X requires OAuth 1.0a credentials (Consumer Key, Consumer Secret, Access Secret). Please reconfigure.' };
    }

    const tweet = `\ud83d\udc7b ${postContent.title}\n\n${postContent.excerpt?.substring(0, 100) || ''}\n\n\ud83d\udd17 ${postContent.url}\n\n\ud83d\udccd Vijayawada`;
    const tweetUrl = 'https://api.twitter.com/2/tweets';
    const authHeader = await buildTwitterAuthHeader(
      'POST', tweetUrl, consumerKey, consumerSecret, config.accessToken, accessSecret
    );

    const res = await fetch(tweetUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: tweet.substring(0, 280) }),
    });
    const data = await res.json();
    if (data.data?.id) return { success: true, postId: data.data.id };
    return { success: false, error: data.title || data.detail || 'Twitter API error' };
  } catch (e: any) { return { success: false, error: e.message }; }
}

async function postToLinkedIn(config: any, postContent: PostContent): Promise<PostResult> {
  try {
    const content = `\ud83d\udc7b ${postContent.title}\n\n${postContent.excerpt?.substring(0, 200) || ''}\n\n\ud83d\udd17 Read more: ${postContent.url}\n\n${postContent.hashtags}\n\n\ud83d\udccd Mouth Care Solutions, Vijayawada`;
    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author: `urn:li:person:${config.accountId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content.substring(0, 700) },
            shareMediaCategory: 'ARTICLE',
            media: [{ status: 'READY', media: { title: postContent.title }, originalUrl: postContent.url }],
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });
    if (res.ok) return { success: true };
    return { success: false, error: `LinkedIn API: ${await res.text()}` };
  } catch (e: any) { return { success: false, error: e.message }; }
}

async function postToWhatsApp(_config: any, postContent: PostContent): Promise<PostResult> {
  const text = encodeURIComponent(`\ud83d\udc7b *${postContent.title}*\n\n${postContent.excerpt?.substring(0, 200) || ''}\n\n\ud83d\udd17 ${postContent.url}\n\n\ud83d\udccd Mouth Care Solutions, Vijayawada`);
  return { success: true, postId: `https://wa.me/?text=${text}` };
}

const POST_FUNCTIONS: Record<string, (config: any, content: PostContent) => Promise<PostResult>> = {
  facebook: postToFacebook,
  instagram: postToInstagram,
  google_business: postToGoogleBusiness,
  twitter: postToTwitter,
  linkedin: postToLinkedIn,
  whatsapp: postToWhatsApp,
};

// ==================== OAUTH FLOW HELPERS ====================

/** Generate OAuth authorization URL for a platform */
export function getOAuthUrl(platform: string, config: any): string | null {
  const extra = config.extraConfig ? JSON.parse(config.extraConfig as string) : {};
  const redirectUri = `${SITE_URL}/api/admin/social/oauth/callback`;
  // SEC-C07 FIX: Use cryptographically random state instead of plain platform name
  const state = generateOAuthState(platform);

  switch (platform) {
    case 'facebook':
      if (!extra.clientId) return null;
      return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${extra.clientId}&redirect_uri=${redirectUri}&scope=pages_show_list,pages_manage_posts,pages_read_engagement&state=${encodeURIComponent(state)}`;
    case 'google_business':
      if (!extra.clientId) return null;
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${extra.clientId}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/business.manage&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;
    default:
      return null;
  }
}

/** Exchange OAuth code for tokens */
export async function exchangeOAuthCode(platform: string, code: string, clientId: string, clientSecret: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number } | null> {
  const redirectUri = `${SITE_URL}/api/admin/social/oauth/callback`;

  switch (platform) {
    case 'facebook': {
      const res = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`);
      const data = await res.json();
      if (!data.access_token) return null;
      // Exchange for long-lived token
      const llRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${data.access_token}`);
      const llData = await llRes.json();
      return { accessToken: llData.access_token || data.access_token, expiresIn: llData.expires_in || data.expires_in };
    }
    case 'google_business': {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
      });
      const data = await res.json();
      if (!data.access_token) return null;
      return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
    }
    default:
      return null;
  }
}

// ==================== EXPORTED FUNCTIONS ====================

export async function postToPlatform(platform: string, postId: string, title: string, excerpt: string, slug: string, keywords: string | null) {
  // Rate limiting: max 5 posts per platform per minute
  if (!checkRateLimit(platform, 5, 60_000)) {
    return { success: false, error: `Rate limited: max 5 posts per minute for ${platform}` };
  }

  const config = await blogDb.getSocialConfig(platform);
  if (!config || !config.enabled || !config.accessToken) {
    return { success: false, error: `${platform} not configured or disabled` };
  }

  const postUrl = `${SITE_URL}/blog/${slug}`;
  const hashtagList = (keywords || 'dental, vijayawada, dentist').split(',').slice(0, 5).map(k => `#${k.trim().replace(/\s+/g, '')}`).join(' ');
  const postContent: PostContent = { title, excerpt: excerpt || '', url: postUrl, hashtags: hashtagList };

  const postFn = POST_FUNCTIONS[platform];
  if (!postFn) return { success: false, error: `Unknown platform: ${platform}` };

  const extraConfig = config.extraConfig ? JSON.parse(config.extraConfig as string) : {};
  const result = await postFn({ ...config, ...extraConfig }, postContent);

  // Log the attempt
  await blogDb.createSocialPostLog({
    platform,
    blogPostId: postId,
    title,
    postUrl,
    socialPostId: result.postId || undefined,
    status: result.success ? 'success' : 'failed',
    response: result.error || undefined,
  });

  if (result.success) {
    await blogDb.updateSocialConfig(platform, {
      lastPostedAt: new Date().toISOString(),
      totalPosts: Number(config.totalPosts || 0) + 1,
      lastError: null,
    });
  } else {
    await blogDb.updateSocialConfig(platform, {
      lastError: result.error?.substring(0, 500),
    });
  }

  return result;
}

export async function autoShareNewPost(postId: string, title: string, excerpt: string, slug: string, keywords: string | null) {
  const configs = await blogDb.getAllSocialConfigs();
  const enabledPlatforms = configs.filter((c: any) => c.enabled && c.accessToken);
  if (enabledPlatforms.length === 0) return { shared: 0, total: 0, results: [] };

  const results: any[] = [];
  for (const pConfig of enabledPlatforms) {
    try {
      const r = await postToPlatform(pConfig.platform as string, postId, title, excerpt, slug, keywords);
      results.push({ platform: pConfig.platform, ...r });
    } catch (err) {
      results.push({ platform: pConfig.platform, success: false, error: String(err) });
    }
  }
  return { shared: results.filter(r => r.success).length, total: results.length, results };
}

export const SOCIAL_PLATFORMS = ['facebook', 'instagram', 'google_business', 'twitter', 'linkedin', 'whatsapp'] as const;
