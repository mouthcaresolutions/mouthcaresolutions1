import { NextRequest, NextResponse } from 'next/server';
import * as blogDb from '@/lib/blog-db';
import { exchangeOAuthCode } from '@/lib/social-poster';

/**
 * OAuth callback for Facebook and Google Business.
 * 1. Admin clicks "Connect" -> OAuth popup opens
 * 2. User authorizes -> redirected here with ?code=...&state=platform
 * 3. We exchange code for tokens and save to DB
 * 4. Redirect to admin social page with success/error param
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const platform = searchParams.get('state');
    const error = searchParams.get('error');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mouthcaresolutions.com';

    if (error) {
      return NextResponse.redirect(`${siteUrl}/rajeshark/social?oauth_error=${encodeURIComponent(error)}`);
    }

    if (!code || !platform) {
      return NextResponse.redirect(`${siteUrl}/rajeshark/social?oauth_error=missing_params`);
    }

    const config = await blogDb.getSocialConfig(platform);
    if (!config) {
      return NextResponse.redirect(`${siteUrl}/rajeshark/social?oauth_error=config_not_found`);
    }

    const extraConfig = config.extraConfig ? JSON.parse(config.extraConfig as string) : {};
    const clientId = extraConfig.clientId;
    const clientSecret = extraConfig.clientSecret;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${siteUrl}/rajeshark/social?oauth_error=missing_credentials`);
    }

    const result = await exchangeOAuthCode(platform, code, clientId, clientSecret);
    if (!result) {
      return NextResponse.redirect(`${siteUrl}/rajeshark/social?oauth_error=token_exchange_failed`);
    }

    const updateData: Record<string, any> = {
      accessToken: result.accessToken,
      enabled: 1,
    };
    if (result.refreshToken) updateData.refreshToken = result.refreshToken;
    updateData.lastRefreshedAt = new Date().toISOString();

    if (result.expiresIn) {
      const updatedExtra = { ...extraConfig, expiresIn: result.expiresIn };
      updateData.extraConfig = JSON.stringify(updatedExtra);
    }

    await blogDb.updateSocialConfig(platform, updateData);

    return NextResponse.redirect(`${siteUrl}/rajeshark/social?oauth_success=${platform}`);
  } catch (err) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mouthcaresolutions.com';
    return NextResponse.redirect(`${siteUrl}/rajeshark/social?oauth_error=server_error`);
  }
}
