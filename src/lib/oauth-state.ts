/**
 * SEC-C07 FIX: OAuth state parameter management for CSRF protection.
 * 
 * The OAuth state parameter must be a cryptographically random token that is:
 * 1. Generated when the OAuth flow starts
 * 2. Stored server-side (in-memory with TTL)
 * 3. Validated on callback to prevent CSRF attacks
 */
import crypto from 'crypto';

interface OAuthStateEntry {
  platform: string;
  createdAt: number;
  // 10 minute TTL
  ttl: number;
}

// In-memory store for OAuth states (TTL-based)
// For production with multiple instances, use Vercel KV or similar
const oauthStates = new Map<string, OAuthStateEntry>();
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a new OAuth state token for a given platform.
 * Returns the state string that should be passed to the OAuth provider.
 */
export function generateOAuthState(platform: string): string {
  // Format: randomHex:platform:timestamp
  const random = crypto.randomBytes(16).toString('hex');
  const state = `${random}:${platform}:${Date.now()}`;
  
  // Store for later validation
  oauthStates.set(random, {
    platform,
    createdAt: Date.now(),
    ttl: STATE_TTL_MS,
  });
  
  // Cleanup expired entries
  cleanupExpiredStates();
  
  return state;
}

/**
 * Validate an OAuth state parameter returned by the provider.
 * Returns the platform name if valid, or null if invalid/expired.
 */
export function validateOAuthState(state: string): string | null {
  if (!state || typeof state !== 'string') return null;
  
  // Parse: randomHex:platform:timestamp
  const colonIndex = state.indexOf(':');
  if (colonIndex === -1) return null;
  
  const randomPart = state.substring(0, colonIndex);
  const entry = oauthStates.get(randomPart);
  
  if (!entry) return null;
  
  // Check expiry
  if (Date.now() - entry.createdAt > entry.ttl) {
    oauthStates.delete(randomPart);
    return null;
  }
  
  // Verify platform matches
  const returnedPlatform = state.substring(colonIndex + 1, state.lastIndexOf(':'));
  if (returnedPlatform !== entry.platform) return null;
  
  // One-time use — delete after validation
  oauthStates.delete(randomPart);
  
  return entry.platform;
}

function cleanupExpiredStates() {
  const now = Date.now();
  for (const [key, entry] of oauthStates.entries()) {
    if (now - entry.createdAt > entry.ttl) {
      oauthStates.delete(key);
    }
  }
}
