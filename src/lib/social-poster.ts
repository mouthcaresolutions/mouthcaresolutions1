import * as blogDb from './blog-db';

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

// ==================== PLATFORM POSTING FUNCTIONS ====================

async function postToFacebook(config: any, postContent: PostContent): Promise<PostResult> {
  try {
    const message = `\ud83d\udc7b ${postContent.title}\n\n${postContent.excerpt?.substring(0, 200) || ''}\n\n\ud83d\udd17 Read more: ${postContent.url}\n\n${postContent.hashtags}\n\n\ud83d\udccd Mouth Care Solutions, Vijayawada`;
    const res = await fetch(`https://graph.facebook.com/v18.0/${config.pageId}/feed`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${config.accessToken}` },
      body: new URLSearchParams({ message, link: postContent.url }),
    });
    const data = await res.json();
    if (data.id) return { success: true, postId: data.id };
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
    const tweet = `\ud83d\udc7b ${postContent.title}\n\n${postContent.excerpt?.substring(0, 100) || ''}\n\n\ud83d\udd17 ${postContent.url}\n\n\ud83d\udccd Vijayawada`;
    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: tweet.substring(0, 280) }),
    });
    const data = await res.json();
    if (data.data?.id) return { success: true, postId: data.data.id };
    return { success: false, error: data.title || 'Twitter API error' };
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

// ==================== EXPORTED FUNCTIONS ====================

export async function postToPlatform(platform: string, postId: string, title: string, excerpt: string, slug: string, keywords: string | null) {
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
