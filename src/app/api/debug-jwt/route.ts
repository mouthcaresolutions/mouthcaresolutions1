import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const secret = process.env.JWT_SECRET;

  let verifyResult: any = 'skipped';
  if (token && secret) {
    try {
      const parts = token.split('.');
      const expectedSig = crypto.createHmac('sha256', secret).update(`${parts[0]}.${parts[1]}`).digest('base64url');
      const sigMatch = parts.length === 3 && parts[2] === expectedSig;
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
      verifyResult = { sigMatch, payloadKeys: Object.keys(payload), exp: payload.exp, now: Math.floor(Date.now()/1000), valid: payload.exp > Math.floor(Date.now()/1000) };
    } catch(e: any) { verifyResult = 'error: ' + e.message; }
  }

  return NextResponse.json({
    hasToken: !!token,
    tokenLen: token?.length || 0,
    tokenPrefix: token?.substring(0, 30),
    hasSecret: !!secret,
    secretLen: secret?.length || 0,
    secretPrefix: secret?.substring(0, 5),
    verifyResult,
  });
}