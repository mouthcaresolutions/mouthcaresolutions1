import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateSession, seedAdmin } from '@/lib/auth';
import { autoShareNewPost } from '@/lib/social-poster';
import { fetchBlogImage, prependImageToContent } from '@/lib/fetch-blog-image';

const ALL_TREATMENTS = [
  { name: 'Root Canal Treatment', keywords: ['root canal', 'endodontic', 'pulp therapy', 'root canal treatment vijayawada', 'painless root canal'] },
  { name: 'Dental Implants', keywords: ['dental implant', 'tooth implant', 'implant dentistry', 'dental implants vijayawada', 'implant cost'] },
  { name: 'Teeth Whitening', keywords: ['teeth whitening', 'tooth bleaching', 'dental whitening', 'whitening vijayawada', 'bright smile'] },
  { name: 'Braces and Aligners', keywords: ['braces', 'orthodontic braces', 'metal braces', 'ceramic braces', 'braces vijayawada'] },
  { name: 'Invisalign and Clear Aligners', keywords: ['invisalign', 'clear aligners', 'invisible braces', 'transparent aligners', 'invisalign vijayawada'] },
  { name: 'Dental Veneers', keywords: ['veneers', 'porcelain veneers', 'dental veneers', 'smile design', 'veneers cost'] },
  { name: 'Dental Crowns and Bridges', keywords: ['dental crown', 'dental bridge', 'crown and bridge', 'tooth cap', 'crown vijayawada'] },
  { name: 'Tooth Extraction', keywords: ['tooth extraction', 'wisdom tooth removal', 'tooth pull', 'dental extraction', 'extraction vijayawada'] },
  { name: 'Wisdom Tooth Surgery', keywords: ['wisdom tooth', 'wisdom tooth surgery', 'impacted wisdom tooth', 'wisdom tooth removal vijayawada'] },
  { name: 'Gum Treatment', keywords: ['gum treatment', 'periodontal treatment', 'gum surgery', 'gum disease', 'gum care vijayawada'] },
  { name: 'Dentures', keywords: ['dentures', 'false teeth', 'complete denture', 'partial denture', 'dentures vijayawada'] },
  { name: 'Pediatric Dentistry', keywords: ['kids dentist', 'pediatric dentist', 'children dental care', 'kids dental', 'pediatric vijayawada'] },
  { name: 'Cosmetic Dentistry', keywords: ['cosmetic dentistry', 'smile makeover', 'dental cosmetics', 'cosmetic dental', 'smile design vijayawada'] },
  { name: 'Dental Cleaning and Scaling', keywords: ['dental cleaning', 'teeth cleaning', 'scaling', 'oral prophylaxis', 'dental scaling vijayawada'] },
  { name: 'Dental Fillings', keywords: ['dental filling', 'tooth filling', 'cavity filling', 'filling cost', 'filling vijayawada'] },
  { name: 'Dental X-Rays and Diagnostics', keywords: ['dental xray', 'dental diagnostics', 'OPG', 'dental imaging', 'dental xray vijayawada'] },
  { name: 'Fluoride Treatment', keywords: ['fluoride treatment', 'fluoride application', 'dental fluoride', 'fluoride therapy'] },
  { name: 'Dental Sealants', keywords: ['dental sealants', 'pit and fissure sealants', 'tooth sealants', 'sealant treatment'] },
  { name: 'Mouth Guards and Night Guards', keywords: ['mouth guard', 'night guard', 'dental guard', 'teeth grinding', 'bruxism treatment'] },
  { name: 'Tooth Sensitivity Treatment', keywords: ['tooth sensitivity', 'sensitive teeth', 'sensitivity treatment', 'dentin hypersensitivity'] },
  { name: 'Bad Breath Treatment', keywords: ['bad breath', 'halitosis', 'bad breath treatment', 'oral malodor', 'breath treatment'] },
  { name: 'Oral Cancer Screening', keywords: ['oral cancer screening', 'mouth cancer', 'oral cancer detection', 'dental cancer checkup'] },
  { name: 'Full Mouth Rehabilitation', keywords: ['full mouth rehabilitation', 'full mouth makeover', 'complete dental rehab', 'mouth rehabilitation'] },
  { name: 'Laser Dentistry', keywords: ['laser dentistry', 'dental laser', 'laser treatment', 'laser dental care', 'laser dentist'] },
  { name: 'Dental Emergency Care', keywords: ['dental emergency', 'emergency dentist', 'toothache emergency', 'emergency dental care vijayawada'] },
];

const TITLE_TEMPLATES: Record<string, string[]> = {
  'Root Canal Treatment': [
    'Complete Guide to Root Canal Treatment in Vijayawada',
    'Is Root Canal Treatment Painful? What to Expect',
    'Root Canal vs Tooth Extraction: Which is Better?',
    'Signs You Need a Root Canal Treatment Immediately',
    'How Long Does a Root Canal Take? Full Timeline',
    'Root Canal Cost in Vijayawada: Complete Price Guide',
    'What Happens if You Delay Root Canal Treatment?',
    'Single Sitting Root Canal: Is It Possible?',
    'Root Canal Treatment Aftercare: Do\'s and Don\'ts',
    'Painless Root Canal Treatment at Mouth Care Solutions',
    'Root Canal Failure: Causes and Treatment Options',
    'Re-treatment of Root Canal: When is It Needed?',
    'Root Canal for Children: Pediatric Endodontics Guide',
    'Best Root Canal Specialist in Vijayawada',
    'Root Canal with Dental Crown: Complete Procedure',
    'Antibiotics Before Root Canal: Are They Necessary?',
    'How to Prepare for Your Root Canal Appointment',
    'Root Canal Recovery: Day-by-Day Healing Guide',
    'Molar Root Canal vs Front Tooth Root Canal',
    'Advanced Root Canal Techniques Used Today',
  ],
  'Dental Implants': [
    'Complete Guide to Dental Implants in Vijayawada',
    'Dental Implant Cost in Vijayawada: 2024 Price Guide',
    'Are Dental Implants Painful? Patient Experience',
    'Dental Implant vs Bridge: Making the Right Choice',
    'Full Mouth Dental Implants: Complete Procedure Guide',
    'How Long Do Dental Implants Last? Longevity Guide',
    'Who is a Good Candidate for Dental Implants?',
    'Single Tooth Implant: Procedure and Recovery',
    'All-on-4 Dental Implants: What You Need to Know',
    'Dental Implant Surgery: Step-by-Step Process',
    'Bone Grafting for Dental Implants: Complete Guide',
    'Mini Dental Implants: Are They Right for You?',
    'Dental Implant Failure: Signs and Prevention',
    'Implant-Supported Dentures: Complete Overview',
    'Best Dental Implant Specialist in Vijayawada',
    'After Dental Implant Surgery: Recovery Timeline',
    'Smoking and Dental Implants: What You Must Know',
    'Dental Implants for Seniors: Special Considerations',
    'Titanium vs Zirconia Dental Implants Comparison',
    'Immediate Loading Dental Implants: Same-Day Teeth',
  ],
  'Teeth Whitening': [
    'Professional Teeth Whitening in Vijayawada: Complete Guide',
    'Teeth Whitening Cost in Vijayawada: Price Breakdown',
    'Laser Teeth Whitening: Procedure and Results',
    'At-Home vs Professional Teeth Whitening Comparison',
    'How Long Does Teeth Whitening Last?',
    'Is Teeth Whitening Safe? Expert Answers',
    'Teeth Whitening Side Effects and How to Avoid Them',
    'Best Teeth Whitening Clinic in Vijayawada',
    'Zoom Teeth Whitening: What to Expect',
    'Teeth Whitening for Sensitive Teeth: Options',
    'Natural Teeth Whitening Remedies: Do They Work?',
    'Teeth Whitening Aftercare: Maintaining Your Bright Smile',
    'How Often Can You Whiten Your Teeth Safely?',
    'Teeth Whitening and Dental Veneers Comparison',
    'Professional Cleaning vs Teeth Whitening Difference',
    'Foods That Stain Teeth and How to Prevent',
    'Hydrogen Peroxide Teeth Whitening: Safety Guide',
    'Charcoal Teeth Whitening: Myth vs Reality',
    'Teeth Whitening Before and After: Real Results',
    'Custom Tray Teeth Whitening: Professional Method',
  ],
};

function generateTitles(treatment: string): string[] {
  if (TITLE_TEMPLATES[treatment]) return TITLE_TEMPLATES[treatment];
  
  const t = treatment;
  const loc = 'Vijayawada';
  return [
    `Complete Guide to ${t} in ${loc}`,
    `${t} Cost in ${loc}: Price Guide 2024`,
    `What to Expect During ${t} Procedure`,
    `Is ${t} Painful? Expert Answers from Dentists`,
    `${t} Recovery: Complete Healing Timeline`,
    `Best ${t} Specialist in ${loc}: Top Dentists`,
    `${t} vs Alternative Treatments: Comparison`,
    `Signs You Need ${t}: Don\'t Ignore These`,
    `How to Prepare for ${t} Appointment`,
    `${t} Aftercare: Essential Tips for Recovery`,
    `Who is a Good Candidate for ${t}?`,
    `${t} for Children: What Parents Should Know`,
    `Advanced ${t} Techniques Used Today`,
    `${t} Side Effects and How to Manage Them`,
    `${t} at Mouth Care Solutions: Why Choose Us`,
    `Frequently Asked Questions About ${t}`,
    `${t} Without Pain: Modern Techniques`,
    `How Long Does ${t} Take? Time Guide`,
    `Cost and Payment Options for ${t} in ${loc}`,
    `${t} Success Rate: What Studies Show`,
  ];
}

const CATEGORY_MAP: Record<string, string[]> = {
  'Root Canal Treatment': ['General Dentistry'],
  'Dental Implants': ['Implants & Prosthodontics'],
  'Teeth Whitening': ['Cosmetic Dentistry'],
  'Braces and Aligners': ['Orthodontics'],
  'Invisalign and Clear Aligners': ['Orthodontics', 'Cosmetic Dentistry'],
  'Dental Veneers': ['Cosmetic Dentistry'],
  'Dental Crowns and Bridges': ['General Dentistry', 'Implants & Prosthodontics'],
  'Tooth Extraction': ['General Dentistry'],
  'Wisdom Tooth Surgery': ['General Dentistry'],
  'Gum Treatment': ['General Dentistry', 'Preventive Dental Care'],
  'Dentures': ['Implants & Prosthodontics'],
  'Pediatric Dentistry': ['Pediatric Dentistry'],
  'Cosmetic Dentistry': ['Cosmetic Dentistry'],
  'Dental Cleaning and Scaling': ['Preventive Dental Care', 'Oral Hygiene'],
  'Dental Fillings': ['General Dentistry'],
  'Dental X-Rays and Diagnostics': ['General Dentistry'],
  'Fluoride Treatment': ['Preventive Dental Care', 'Pediatric Dentistry'],
  'Dental Sealants': ['Preventive Dental Care', 'Pediatric Dentistry'],
  'Mouth Guards and Night Guards': ['General Dentistry', 'Preventive Dental Care'],
  'Tooth Sensitivity Treatment': ['General Dentistry', 'Oral Hygiene'],
  'Bad Breath Treatment': ['Oral Hygiene', 'General Dentistry'],
  'Oral Cancer Screening': ['Preventive Dental Care', 'General Dentistry'],
  'Full Mouth Rehabilitation': ['Cosmetic Dentistry', 'Implants & Prosthodontics'],
  'Laser Dentistry': ['General Dentistry', 'Cosmetic Dentistry'],
  'Dental Emergency Care': ['General Dentistry'],
};

function generatePrompt(title: string, treatment: string, keywords: string[], category: string): string {
  return `You are a professional dental content writer for Mouth Care Solutions, a leading dental clinic in Vijayawada, Andhra Pradesh, India. Write a comprehensive, SEO-optimized, long-form article (minimum 1500 words, ideally 2000+ words).

TITLE: ${title}

PRIMARY KEYWORDS: ${keywords.join(', ')}
SECONDARY KEYWORDS: dentist in Vijayawada, dental clinic Vijayawada, best dentist Vijayawada, Mouth Care Solutions, dental treatment Vijayawada, tooth doctor near me, dental care Andhra Pradesh
CATEGORY: ${category}

REQUIREMENTS:
1. Write in professional yet accessible tone, targeting patients in Vijayawada and Andhra Pradesh
2. Include the city name "Vijayawada" naturally 5-8 times throughout the article
3. Mention "Mouth Care Solutions" 2-3 times as the expert clinic
4. Use H2 headings (## Heading) for major sections and H3 (### Heading) for subsections
5. Each paragraph must be substantial (4-6 sentences minimum)
6. Include specific details: costs in INR range, procedure duration, recovery times, technology used
7. Add a FAQ section with 5-7 common questions at the end
8. Include a "Why Choose Mouth Care Solutions for ${treatment} in Vijayawada" section
9. Naturally weave in keywords without keyword stuffing
10. Write the article in markdown format starting with the title as # heading

STRUCTURE:
# ${title}

## What is ${treatment}?
(4-5 paragraph detailed explanation)

## Why is ${treatment} Important?
(3-4 paragraphs on importance and benefits)

## Signs You Need ${treatment}
(3-4 paragraphs listing signs with detailed descriptions)

## The ${treatment} Procedure: Step by Step
(5-6 paragraphs detailing the complete procedure)

## ${treatment} Cost in Vijayawada
(3-4 paragraphs with cost ranges and factors affecting price)

## Benefits of ${treatment}
(3-4 paragraphs on advantages)

## ${treatment} Recovery and Aftercare
(3-4 paragraphs on recovery timeline and tips)

## Why Choose Mouth Care Solutions for ${treatment} in Vijayawada
(2-3 paragraphs promoting the clinic)

## Frequently Asked Questions
(5-7 Q&A pairs)

Write the complete article now. Make it detailed, informative, and SEO-optimized.`;
}

async function generateArticle(title: string, treatment: string, keywords: string[], category: string): Promise<{ content: string; excerpt: string; metaDesc: string } | null> {
  try {
    // z-ai-web-dev-sdk: exports ZAI class with create() factory
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    const prompt = generatePrompt(title, treatment, keywords, category);

    const result = await zai.createChatCompletion({
      model: 'glm-4-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
      temperature: 0.8,
    });

    const content = result?.choices?.[0]?.message?.content || '';

    if (!content || content.length < 500) return null;

    const firstParagraph = content.split('\n\n').find(p => p.length > 100 && !p.startsWith('#')) || '';
    const excerpt = firstParagraph.substring(0, 300).trim();
    const metaDesc = excerpt.substring(0, 160).trim();

    return { content, excerpt, metaDesc };
  } catch (error) {
    console.error('Article generation failed:', title, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const config = await db.autoBloggerConfig.findFirst();
    const logs = await db.autoBloggerLog.findMany({
      orderBy: { ranAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ config, logs, treatments: ALL_TREATMENTS.map(t => t.name) });
  } catch (error) {
    console.error('Autoblogger GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await seedAdmin();

    const body = await request.json();
    const { action } = body;

    // Update config
    if (action === 'updateConfig') {
      const config = await db.autoBloggerConfig.findFirst();
      if (!config) return NextResponse.json({ error: 'No config found' }, { status: 404 });
      
      const updated = await db.autoBloggerConfig.update({
        where: { id: config.id },
        data: {
          enabled: body.enabled ?? config.enabled,
          postsPerDay: body.postsPerDay ?? config.postsPerDay,
          categories: body.categories ?? config.categories,
        },
      });
      return NextResponse.json({ config: updated, success: true });
    }

    // Generate posts now
    if (action === 'generateNow') {
      const count = Math.min(body.count || 3, 10); // Cap at 10 per request
      const publishDirectly = body.publishDirectly === true; // Explicit opt-in only
      const startTime = Date.now();
      let postsCreated = 0;
      let postsFailed = 0;
      let errorMsg: string | null = null;

      // Update status to running
      const config = await db.autoBloggerConfig.findFirst();
      if (config) {
        await db.autoBloggerConfig.update({
          where: { id: config.id },
          data: { status: 'running', lastRunAt: new Date() },
        });
      }

      const enabledCategories = config?.categories?.split(',').map(c => c.trim()).filter(Boolean) || 
        ['General Dentistry', 'Cosmetic Dentistry', 'Oral Hygiene'];

      for (let i = 0; i < count; i++) {
        try {
          // Pick a random treatment
          const treatment = ALL_TREATMENTS[Math.floor(Math.random() * ALL_TREATMENTS.length)];
          const titles = generateTitles(treatment.name);
          const title = titles[Math.floor(Math.random() * titles.length)];
          const cats = CATEGORY_MAP[treatment.name] || ['General Dentistry'];
          const category = cats.find(c => enabledCategories.includes(c)) || cats[0];
          
          const result = await generateArticle(title, treatment.name, treatment.keywords, category);
          
          if (result) {
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36) + i;
            
            // Fetch unique image for this blog post
            let contentWithImage = result.content;
            try {
              const imageUrl = await fetchBlogImage(treatment.name, title, category);
              contentWithImage = prependImageToContent(result.content, imageUrl, title);
            } catch (imgErr) {
              console.error('Image fetch failed for:', title, imgErr);
            }

            const newPost = await db.blogPost.create({
              data: {
                slug,
                title,
                content: contentWithImage,
                excerpt: result.excerpt,
                metaDesc: result.metaDesc,
                metaTitle: title,
                category,
                keywords: treatment.keywords.join(', '),
                status: publishDirectly ? 'published' : 'draft',
                author: 'Mouth Care Solutions',
                scheduledAt: new Date(),
              },
            });
            postsCreated++;

            // Only auto-share if explicitly published
            if (publishDirectly) {
              try {
                await autoShareNewPost(newPost.id, newPost.title, newPost.excerpt || '', newPost.slug, newPost.keywords);
              } catch (socialErr) {
                console.error('Social auto-share error:', socialErr);
              }
            }
          } else {
            postsFailed++;
          }
          
          // Small delay between generations
          await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
          console.error('Post generation error:', err);
          postsFailed++;
        }
      }

      // Update status
      if (config) {
        await db.autoBloggerConfig.update({
          where: { id: config.id },
          data: {
            status: 'idle',
            totalGenerated: { increment: postsCreated },
            failedCount: { increment: postsFailed },
            nextRunAt: new Date(Date.now() + (24 * 60 * 60 * 1000) / (config.postsPerDay || 3) * (count || 3)),
          },
        });
      }

      // Log the run
      await db.autoBloggerLog.create({
        data: {
          status: postsCreated > 0 ? 'success' : 'failed',
          postsCreated,
          postsFailed,
          error: errorMsg,
          duration: Math.round((Date.now() - startTime) / 1000),
        },
      });

      return NextResponse.json({ 
        success: true, 
        postsCreated, 
        postsFailed,
        duration: Math.round((Date.now() - startTime) / 1000),
      });
    }

    // Bulk generate for specific treatment
    if (action === 'bulkGenerate') {
      const { treatmentName, count: bulkCount } = body;
      if (!treatmentName) return NextResponse.json({ error: 'Treatment name required' }, { status: 400 });
      
      const treatment = ALL_TREATMENTS.find(t => t.name === treatmentName);
      if (!treatment) return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });

      const numToGenerate = Math.min(bulkCount || 10, 50);
      const startTime = Date.now();
      let postsCreated = 0;
      let postsFailed = 0;

      const titles = generateTitles(treatment.name);
      const cats = CATEGORY_MAP[treatment.name] || ['General Dentistry'];

      for (let i = 0; i < numToGenerate; i++) {
        const title = titles[i % titles.length];
        const category = cats[i % cats.length];
        const uniqueTitle = numToGenerate > titles.length ? `${title} - Part ${Math.floor(i / titles.length) + 1}` : title;
        
        try {
          const result = await generateArticle(uniqueTitle, treatment.name, treatment.keywords, category);
          if (result) {
            const slug = uniqueTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80) + '-' + Date.now().toString(36) + i;
            await db.blogPost.create({
              data: {
                slug,
                title: uniqueTitle,
                content: result.content,
                excerpt: result.excerpt,
                metaDesc: result.metaDesc,
                metaTitle: uniqueTitle,
                category,
                keywords: treatment.keywords.join(', '),
                status: 'draft', // Always draft for bulk - requires review
                author: 'Mouth Care Solutions',
                scheduledAt: new Date(Date.now() + i * 3600000),
              },
            });
            postsCreated++;
          } else {
            postsFailed++;
          }
          await new Promise(r => setTimeout(r, 2000));
        } catch (err) {
          console.error('Bulk generation error:', err);
          postsFailed++;
        }
      }

      await db.autoBloggerLog.create({
        data: {
          status: postsCreated > 0 ? 'success' : 'failed',
          postsCreated,
          postsFailed,
          duration: Math.round((Date.now() - startTime) / 1000),
        },
      });

      return NextResponse.json({
        success: true,
        postsCreated,
        postsFailed,
        duration: Math.round((Date.now() - startTime) / 1000),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Autoblogger POST error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
