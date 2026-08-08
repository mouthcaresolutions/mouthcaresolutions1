import { PrismaClient } from '@prisma/client';
import ZAI from 'z-ai-web-dev-sdk';

const prisma = new PrismaClient();

const CATEGORIES = [
  'General Dentistry',
  'Cosmetic Dentistry',
  'Oral Hygiene',
  'Pediatric Dentistry',
  'Implants & Prosthodontics',
  'Orthodontics',
  'Preventive Dental Care',
];

const LOCATION_KEYWORDS = [
  'Vijayawada', 'Andhra Pradesh', 'Suryaraopeta',
];

const SERVICE_KEYWORDS = [
  'dentist in Vijayawada', 'dental clinic near me',
  'root canal treatment Vijayawada', 'teeth whitening Vijayawada',
  'braces Vijayawada', 'dental implants Vijayawada',
  'cosmetic dentistry Vijayawada', 'smile makeover Vijayawada',
  'best dentist Vijayawada', 'dental clinic Vijayawada',
  'tooth extraction Vijayawada', 'wisdom tooth removal Vijayawada',
  'dentures Vijayawada', 'gum treatment Vijayawada',
  'pediatric dentist Vijayawada', 'kids dentist Vijayawada',
  'Invisalign Vijayawada', 'clear aligners Vijayawada',
  'dental cleaning Vijayawada', 'cavity filling Vijayawada',
  'dental crown Vijayawada', 'dental bridge Vijayawada',
  'veneers Vijayawada', 'tooth pain relief Vijayawada',
  'emergency dentist Vijayawada', 'affordable dentist Vijayawada',
  'dental checkup Vijayawada', 'fluoride treatment Vijayawada',
  'gum disease treatment Vijayawada', 'bad breath treatment Vijayawada',
  'sensitive teeth treatment Vijayawada', 'teeth bonding Vijayawada',
  'full mouth rehabilitation Vijayawada', 'dental x-ray Vijayawada',
  'oral cancer screening Vijayawada', 'dental sealants Vijayawada',
  'teeth scaling Vijayawada', 'periodontal treatment Vijayawada',
  'root canal cost Vijayawada', 'implant cost Vijayawada',
  'braces cost Vijayawada', 'whitening cost Vijayawada',
];

const TOPIC_TEMPLATES: Record<string, string[]> = {
  'General Dentistry': [
    'Complete Guide to {kw} for Healthy Teeth',
    'What to Expect During {kw} at a Dental Clinic',
    'Top 10 Reasons to Visit a {kw} Regularly',
    'How Often Should You Get {kw}? Expert Advice',
    'Signs You Need {kw} Immediately',
    'The Ultimate Guide to {kw} - Everything You Need to Know',
    '{kw}: Myths vs Facts Every Patient Should Know',
    'Cost of {kw} in Vijayawada - What to Expect',
    'How to Prepare for Your {kw} Appointment',
    'Aftercare Tips Following {kw}',
    'Is {kw} Painful? What Patients Really Experience',
    'Why Choose Mouth Care Solutions for {kw}',
    '{kw} for Seniors: Special Considerations',
    'Latest Advances in {kw} Technology',
    'Comparing {kw} Options: Which is Right for You',
  ],
  'Cosmetic Dentistry': [
    'Transform Your Smile with {kw} - Before and After Results',
    'How {kw} Can Boost Your Confidence',
    '{kw} Cost in Vijayawada - Complete Price Guide',
    'Top 5 {kw} Procedures for a Perfect Smile',
    'What Makes a Good Candidate for {kw}',
    '{kw}: Procedure, Recovery, and Results Explained',
    'How Long Do {kw} Results Last?',
    'Celebrities Who Got {kw} - Inspiration for Your Smile',
    '{kw} vs Alternatives: Which Gives Better Results',
    'Patient Guide: Your First {kw} Consultation',
  ],
  'Oral Hygiene': [
    'Best Practices for {kw} at Home',
    'Top Mistakes People Make with {kw}',
    'How {kw} Prevents Expensive Dental Treatments',
    'Expert Tips for Better {kw} Results',
    '{kw} Routine Recommended by Dentists',
    'Natural Remedies vs Professional {kw}',
    'How to Teach Kids About {kw}',
    'The Connection Between {kw} and Overall Health',
    'Seasonal {kw} Tips You Should Follow',
    'Products That Actually Help with {kw}',
  ],
  'Pediatric Dentistry': [
    'When Should Your Child First Visit a {kw}',
    'How to Make {kw} Fun for Kids',
    'Common Children\'s Dental Problems Treated by {kw}',
    '{kw} for Kids: What Parents Need to Know',
    'Preparing Your Child for {kw} - Parent Guide',
    'Why Early {kw} Matters for Your Child\'s Development',
    'Top Questions Parents Ask About {kw}',
    'Choosing the Right {kw} for Your Family',
    '{kw} and School Dental Health Programs',
    'Preventing Cavities: {kw} Tips for Children',
  ],
  'Implants & Prosthodontics': [
    'Are {kw} Right for You? Complete Eligibility Guide',
    '{kw} Cost in Vijayawada - Transparent Pricing',
    'The {kw} Process Step by Step',
    'How Long Do {kw} Last? Long-Term Success Rates',
    '{kw} vs Dentures vs Bridges: Complete Comparison',
    'What to Expect After {kw} Surgery',
    'Foods to Eat and Avoid After {kw}',
    'Top 10 Questions About {kw} Answered',
    '{kw} for Missing Teeth: Why They Are the Gold Standard',
    'Success Stories: Real Patients Who Got {kw}',
  ],
  'Orthodontics': [
    '{kw} for Adults: It is Never Too Late',
    'How Long Does {kw} Treatment Take?',
    '{kw} Cost in Vijayawada - Affordability Guide',
    'Traditional {kw} vs Clear Aligners: Which to Choose',
    'What Can You Eat With {kw}? Complete Diet Guide',
    '{kw} Pain Management: Tips from Orthodontists',
    'How to Maintain Oral Hygiene During {kw}',
    '{kw} for Teens: What Every Parent Should Know',
    'Signs Your Child Needs {kw}',
    'Life After {kw}: Maintaining Your New Smile',
  ],
  'Preventive Dental Care': [
    'Why {kw} Is Your Best Investment in Oral Health',
    'How Often Should You Get {kw}? Expert Recommendations',
    '{kw} Checklist: What Happens During Your Visit',
    'The Real Cost of Skipping {kw}',
    '{kw} for the Whole Family: A Complete Guide',
    'How {kw} Detects Problems Before They Hurt',
    'Insurance Coverage for {kw} in Vijayawada',
    '{kw} and Early Detection of Oral Cancer',
    'Building a {kw} Routine That Actually Works',
    'Why {kw} Matters More as You Age',
  ],
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 120);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePostTopics(count: number): { title: string; category: string; keyword: string }[] {
  const topics: { title: string; category: string; keyword: string }[] = [];
  const usedTitles = new Set<string>();

  for (let i = 0; i < count; i++) {
    const category = pickRandom(CATEGORIES);
    const keyword = pickRandom(SERVICE_KEYWORDS);
    const templates = TOPIC_TEMPLATES[category] || TOPIC_TEMPLATES['General Dentistry'];
    const template = pickRandom(templates);
    let title = template.replace(/{kw}/g, keyword);

    // Avoid duplicates
    if (usedTitles.has(title)) {
      // Try another template
      for (const t of templates) {
        const alt = t.replace(/{kw}/g, keyword);
        if (!usedTitles.has(alt)) { title = alt; break; }
      }
    }
    usedTitles.add(title);
    topics.push({ title, category, keyword });
  }
  return topics;
}

async function generatePostContent(zai: any, topic: { title: string; category: string; keyword: string }): Promise<{ content: string; metaDesc: string; excerpt: string; metaTitle: string }> {
  const prompt = `Write an SEO-optimized blog post for a dental clinic website. 

Title: ${topic.title}
Category: ${topic.category}
Target Keyword: ${topic.keyword}
Clinic: Mouth Care Solutions, Vijayawada, Andhra Pradesh
Phone: +91 9866344866

Requirements:
- 500-700 words
- Use the target keyword naturally 4-6 times
- Mention "Vijayawada" at least 3 times
- Include related dental keywords naturally
- Write in a professional but friendly tone
- Include actionable tips and advice
- End with: "Visit Mouth Care Solutions, Vijayawada, for expert dental care. Call 9866344866 or WhatsApp +91 9866344866 to book your appointment today!"
- Use short paragraphs (2-3 sentences each)
- Include 2-3 subheadings using ## format

Return ONLY valid JSON with this exact format (no markdown, no code fences):
{"content": "<the full blog post content in plain text with ## subheadings>", "metaDesc": "<compelling 150-160 character meta description>", "excerpt": "<2-3 sentence summary excerpt>", "metaTitle": "<SEO optimized title tag under 60 chars>"}`;

  try {
    const response = await zai.chat.completions.create({
      model: 'glm-4-flash',
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = response.choices[0]?.message?.content?.trim() || '';
    // Try to extract JSON
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    // Fallback
    return {
      content: raw,
      metaDesc: `${topic.title} - Visit Mouth Care Solutions in Vijayawada for expert dental care. Call 9866344866 to book.`,
      excerpt: raw.substring(0, 200).trim(),
      metaTitle: topic.title.substring(0, 58),
    };
  } catch (err) {
    console.error(`Error generating content for: ${topic.title}`, err);
    return {
      content: `${topic.title}. Visit Mouth Care Solutions, Vijayawada, for expert dental care. Call 9866344866 or WhatsApp +91 9866344866 to book your appointment today!`,
      metaDesc: `${topic.title} - Visit Mouth Care Solutions in Vijayawada. Call 9866344866.`,
      excerpt: `${topic.title}. Visit Mouth Care Solutions, Vijayawada for expert dental care.`,
      metaTitle: topic.title.substring(0, 58),
    };
  }
}

async function main() {
  const POST_COUNT = parseInt(process.argv[2] || '100', 10);
  console.log(`Generating ${POST_COUNT} SEO blog posts...`);
  
  const zai = await ZAI.create();
  const topics = generatePostTopics(POST_COUNT);
  
  let created = 0;
  let errors = 0;
  
  // Process in batches of 5 concurrent
  const BATCH_SIZE = 5;
  for (let i = 0; i < topics.length; i += BATCH_SIZE) {
    const batch = topics.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (topic) => {
        const { content, metaDesc, excerpt, metaTitle } = await generatePostContent(zai, topic);
        return prisma.blogPost.create({
          data: {
            slug: slugify(topic.title),
            title: topic.title,
            metaTitle,
            metaDesc,
            content,
            excerpt,
            category: topic.category,
            keywords: topic.keyword,
            author: 'Mouth Care Solutions',
            scheduledAt: new Date(Date.now() + (created + i) * 24 * 60 * 60 * 1000),
          },
        });
      })
    );
    
    for (const r of results) {
      if (r.status === 'fulfilled') {
        created++;
      } else {
        errors++;
      }
    }
    
    console.log(`Progress: ${Math.min(i + BATCH_SIZE, topics.length)}/${topics.length} (${created} created, ${errors} errors)`);
    
    // Small delay between batches
    if (i + BATCH_SIZE < topics.length) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  console.log(`\nDone! Created: ${created}, Errors: ${errors}, Total: ${topics.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
