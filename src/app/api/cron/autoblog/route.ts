// Auto-blog cron endpoint - called by external cron service (cron-job.org)
// Uses CRON_SECRET for authentication

import { NextRequest, NextResponse } from 'next/server';
import * as blogDb from '@/lib/blog-db';
import { fetchBlogImage, prependImageToContent } from '@/lib/fetch-blog-image';

const TREATMENTS = [
  { name: 'Root Canal Treatment', keywords: ['root canal', 'endodontic', 'root canal treatment vijayawada'] },
  { name: 'Dental Implants', keywords: ['dental implant', 'tooth implant', 'dental implants vijayawada'] },
  { name: 'Teeth Whitening', keywords: ['teeth whitening', 'tooth bleaching', 'whitening vijayawada'] },
  { name: 'Braces and Aligners', keywords: ['braces', 'orthodontic braces', 'braces vijayawada'] },
  { name: 'Dental Veneers', keywords: ['veneers', 'porcelain veneers', 'smile design'] },
  { name: 'Dental Crowns and Bridges', keywords: ['dental crown', 'dental bridge', 'tooth cap'] },
  { name: 'Gum Treatment', keywords: ['gum treatment', 'periodontal treatment', 'gum disease'] },
  { name: 'Pediatric Dentistry', keywords: ['kids dentist', 'pediatric dentist', 'children dental care'] },
  { name: 'Cosmetic Dentistry', keywords: ['cosmetic dentistry', 'smile makeover', 'dental cosmetics'] },
  { name: 'Dental Cleaning', keywords: ['dental cleaning', 'teeth cleaning', 'scaling vijayawada'] },
  { name: 'Dental Fillings', keywords: ['dental filling', 'tooth filling', 'cavity filling'] },
  { name: 'Tooth Extraction', keywords: ['tooth extraction', 'wisdom tooth removal', 'dental extraction'] },
  { name: 'Wisdom Tooth Surgery', keywords: ['wisdom tooth surgery', 'impacted wisdom tooth'] },
  { name: 'Dentures', keywords: ['dentures', 'false teeth', 'complete denture'] },
  { name: 'Laser Dentistry', keywords: ['laser dentistry', 'dental laser', 'laser treatment'] },
  { name: 'Dental Emergency', keywords: ['dental emergency', 'emergency dentist vijayawada'] },
  { name: 'Invisalign', keywords: ['invisalign', 'clear aligners', 'invisible braces vijayawada'] },
  { name: 'Fluoride Treatment', keywords: ['fluoride treatment', 'fluoride application', 'dental fluoride'] },
  { name: 'Mouth Guards', keywords: ['mouth guard', 'night guard', 'teeth grinding'] },
  { name: 'Oral Cancer Screening', keywords: ['oral cancer screening', 'mouth cancer', 'dental cancer checkup'] },
  { name: 'Tooth Sensitivity', keywords: ['tooth sensitivity', 'sensitive teeth', 'sensitivity treatment'] },
  { name: 'Bad Breath Treatment', keywords: ['bad breath', 'halitosis', 'bad breath treatment'] },
  { name: 'Full Mouth Rehabilitation', keywords: ['full mouth rehabilitation', 'full mouth makeover'] },
];

const CATEGORIES = ['General Dentistry', 'Cosmetic Dentistry', 'Oral Hygiene', 'Pediatric Dentistry', 'Implants & Prosthodontics', 'Orthodontics', 'Preventive Dental Care'];

function generateTitle(treatment: string): string {
  const templates = [
    `Complete Guide to ${treatment} in Vijayawada`,
    `${treatment} Cost in Vijayawada: 2025 Price Guide`,
    `Is ${treatment} Painful? What Patients Should Know`,
    `${treatment} Recovery: Complete Healing Timeline`,
    `Best ${treatment} Specialist in Vijayawada`,
    `Signs You Need ${treatment}: Don't Ignore These`,
    `${treatment} Aftercare: Essential Tips for Recovery`,
    `Why Choose Mouth Care Solutions for ${treatment}`,
    `Frequently Asked Questions About ${treatment}`,
    `Advanced ${treatment} Techniques in Modern Dentistry`,
    `${treatment} for Children: What Parents Should Know`,
    `How Long Does ${treatment} Take? Complete Guide`,
    `${treatment} vs Alternative Treatments: Which is Better?`,
    `What to Expect During ${treatment} Procedure`,
    `${treatment} Success Rate: What Studies Show`,
    `Preparing for ${treatment}: Complete Checklist`,
    `${treatment} Without Pain: Modern Techniques at MCS`,
    `Insurance Coverage for ${treatment} in Vijayawada`,
    `${treatment} Side Effects and How to Manage Them`,
    `Top 10 Myths About ${treatment} Debunked`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

/** CRITICAL FIX #2: Timing-safe constant-time string comparison */
function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);
  if (aBuf.length !== bBuf.length) return false;
  // XOR each byte — if any differ, result is non-zero
  let result = 0;
  for (let i = 0; i < aBuf.length; i++) {
    result |= aBuf[i] ^ bBuf[i];
  }
  return result === 0;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    // CRITICAL FIX #2: Use timing-safe comparison for cron secret
    const authHeader = request.headers.get('authorization') || '';
    const expectedSecret = `Bearer ${process.env.CRON_SECRET || ''}`;
    if (!timingSafeEqual(authHeader, expectedSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Config check
    const config = await blogDb.getAutoBloggerConfig();
    if (!config || !config.enabled) {
      return NextResponse.json({ message: 'Auto-blogger disabled' });
    }

    // CRITICAL FIX #4: Set status to 'running' BEFORE generating (concurrency guard)
    // Also fixes HIGH #4: concurrency guard now actually works
    if (config.status === 'running') {
      // Check if it's been stuck for more than 10 minutes (stale lock)
      const lastRun = config.lastRunAt ? new Date(String(config.lastRunAt)).getTime() : 0;
      if (Date.now() - lastRun < 10 * 60 * 1000) {
        return NextResponse.json({ message: 'Already running' });
      }
      // Stale lock — reset and proceed
      console.warn('Cron: Stale "running" lock detected, resetting');
    }
    await blogDb.setConfigStatus(String(config.id), 'running');

    // Generate 1 post per cron call
    const treatment = TREATMENTS[Math.floor(Math.random() * TREATMENTS.length)];
    const title = generateTitle(treatment.name);
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

    // z-ai-web-dev-sdk: exports ZAI class with create() factory
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    const prompt = `You are a professional dental content writer for Mouth Care Solutions, a leading dental clinic in Vijayawada, Andhra Pradesh, India. Write a comprehensive, SEO-optimized, long-form article (minimum 1500 words, ideally 2000+ words) in markdown format.

TITLE: ${title}
KEYWORDS: ${treatment.keywords.join(', ')}, dentist in Vijayawada, dental clinic Vijayawada, best dentist Vijayawada, Mouth Care Solutions
CATEGORY: ${category}

STRUCTURE: Use H2/H3 headings. Include: What is ${treatment.name}, why it's important, signs you need it, step-by-step procedure, cost in Vijayawada (INR), benefits, recovery, why choose Mouth Care Solutions, and 5-7 FAQs. Mention Vijayawada 5-8 times and Mouth Care Solutions 2-3 times. Each paragraph 4-6 sentences minimum.`;

    const result = await (zai as any).createChatCompletion({
      model: 'glm-4-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
      temperature: 0.85,
    });

    const content = result?.choices?.[0]?.message?.content || '';

    if (!content || content.length < 500) {
      // CRITICAL FIX #6: Still set status to idle on failure
      await blogDb.setConfigStatus(String(config.id), 'idle');
      const duration = Math.round((Date.now() - startTime) / 1000);
      await blogDb.createAutoBloggerLog({ status: 'failed', postsCreated: 0, postsFailed: 1, error: 'Content too short', duration });
      return NextResponse.json({ error: 'Content too short' }, { status: 500 });
    }

    const firstParagraph = content.split('\n\n').find(p => p.length > 100 && !p.startsWith('#')) || '';
    const excerpt = firstParagraph.substring(0, 300).trim();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    // Fetch image for the blog post
    let finalContent = content;
    try {
      const imageUrl = await fetchBlogImage(treatment.name, title, category);
      finalContent = prependImageToContent(content, imageUrl, title);
    } catch (imgErr) {
      console.error('Image fetch failed:', imgErr);
    }

    // CRITICAL FIX #6: Create as draft, do NOT share to social media
    // Social sharing only happens when admin explicitly publishes
    const newPost = await blogDb.createBlogPost({
      slug,
      title,
      content: finalContent,
      excerpt,
      metaDesc: excerpt.substring(0, 160),
      metaTitle: title,
      category,
      keywords: treatment.keywords.join(', '),
      status: 'draft',
      author: 'Mouth Care Solutions',
      scheduledAt: new Date().toISOString(),
    });

    // Update config stats
    const nextRunAt = new Date(Date.now() + (24 * 60 * 60 * 1000) / (Number(config.postsPerDay) || 3));
    await blogDb.incrementConfigStats(String(config.id), 1, 0, nextRunAt.toISOString());
    await blogDb.setConfigStatus(String(config.id), 'idle');

    // HIGH #7 FIX: Track actual duration
    const duration = Math.round((Date.now() - startTime) / 1000);
    await blogDb.createAutoBloggerLog({ status: 'success', postsCreated: 1, postsFailed: 0, duration });

    // CRITICAL FIX #6: Removed autoShareNewPost — draft posts must NOT be shared

    return NextResponse.json({ success: true, title, slug });
  } catch (error) {
    console.error('Cron autoblog error:', error);
    // Ensure status is reset to idle even on error
    try {
      const config = await blogDb.getAutoBloggerConfig();
      if (config) await blogDb.setConfigStatus(String(config.id), 'idle');
    } catch { /* best effort */ }
    const duration = Math.round((Date.now() - startTime) / 1000);
    try {
      await blogDb.createAutoBloggerLog({ status: 'failed', postsCreated: 0, postsFailed: 1, error: String(error), duration });
    } catch { /* best effort */ }
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
