// Auto-blog cron endpoint - call periodically to auto-generate posts
// In production, set up a cron job (e.g., Vercel Cron, GitHub Actions) to call this every 8-12 hours
// For development, it runs when accessed and conditions are met

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const config = await db.autoBloggerConfig.findFirst();
    if (!config || !config.enabled || config.status === 'running') {
      return NextResponse.json({ message: 'Not scheduled' });
    }
    const now = Date.now();
    const interval = (24 * 60 * 60 * 1000) / (config.postsPerDay || 3);
    const shouldRun = !config.nextRunAt || now >= new Date(config.nextRunAt).getTime();
    if (!shouldRun) return NextResponse.json({ message: 'Not time yet', nextRun: config.nextRunAt });
    return NextResponse.json({ message: 'Auto-blog should run - use admin dashboard to trigger' });
  } catch (error) {
    return NextResponse.json({ error: 'Cron check failed' }, { status: 500 });
  }
}
