import { PrismaClient } from '@prisma/client';
import ZAI from 'z-ai-web-dev-sdk';

const prisma = new PrismaClient();

// ============================================
// COMPREHENSIVE DENTAL TREATMENT LIST
// Each treatment gets 50-120+ unique article topics
// ============================================

const TREATMENTS = [
  { name: 'Root Canal Treatment', keywords: ['root canal treatment Vijayawada', 'root canal cost Vijayawada', 'painless root canal Vijayawada', 'RCT Vijayawada', 'root canal specialist Vijayawada', 'single sitting root canal Vijayawada', 'root canal therapy Vijayawada'], category: 'Endodontics' },
  { name: 'Dental Implants', keywords: ['dental implants Vijayawada', 'implant cost Vijayawada', 'tooth implant Vijayawada', 'dental implant specialist Vijayawada', 'full mouth implants Vijayawada', 'implant supported denture Vijayawada', 'single tooth implant Vijayawada'], category: 'Implants & Prosthodontics' },
  { name: 'Teeth Whitening', keywords: ['teeth whitening Vijayawada', 'teeth bleaching Vijayawada', 'whitening cost Vijayawada', 'laser teeth whitening Vijayawada', 'professional teeth whitening Vijayawada', 'teeth whitening dentist Vijayawada', 'bright smile Vijayawada'], category: 'Cosmetic Dentistry' },
  { name: 'Dental Braces', keywords: ['braces Vijayawada', 'braces cost Vijayawada', 'orthodontic braces Vijayawada', 'metal braces Vijayawada', 'ceramic braces Vijayawada', 'braces treatment Vijayawada', 'teeth straightening Vijayawada'], category: 'Orthodontics' },
  { name: 'Invisalign and Clear Aligners', keywords: ['Invisalign Vijayawada', 'clear aligners Vijayawada', 'invisible braces Vijayawada', 'aligner cost Vijayawada', 'Invisalign dentist Vijayawada', 'clear aligner treatment Vijayawada', 'transparent braces Vijayawada'], category: 'Orthodontics' },
  { name: 'Dental Veneers', keywords: ['veneers Vijayawada', 'porcelain veneers Vijayawada', 'veneer cost Vijayawada', 'dental veneers near me', 'smile design veneers Vijayawada', 'composite veneers Vijayawada', 'Hollywood smile Vijayawada'], category: 'Cosmetic Dentistry' },
  { name: 'Dental Crowns', keywords: ['dental crown Vijayawada', 'crown cost Vijayawada', 'porcelain crown Vijayawada', 'zirconia crown Vijayawada', 'tooth cap Vijayawada', 'crown treatment Vijayawada', 'same day crown Vijayawada'], category: 'Restorative Dentistry' },
  { name: 'Dental Bridges', keywords: ['dental bridge Vijayawada', 'bridge cost Vijayawada', 'fixed bridge Vijayawada', 'tooth bridge Vijayawada', 'dental bridge treatment Vijayawada', 'bridge dentist Vijayawada', 'missing tooth bridge Vijayawada'], category: 'Restorative Dentistry' },
  { name: 'Dentures', keywords: ['dentures Vijayawada', 'complete denture Vijayawada', 'partial denture Vijayawada', 'denture cost Vijayawada', 'flexible denture Vijayawada', 'denture repair Vijayawada', 'best dentures Vijayawada'], category: 'Implants & Prosthodontics' },
  { name: 'Wisdom Tooth Removal', keywords: ['wisdom tooth removal Vijayawada', 'wisdom tooth extraction Vijayawada', 'impacted wisdom tooth Vijayawada', 'wisdom tooth surgery Vijayawada', 'wisdom tooth pain Vijayawada', 'wisdom tooth cost Vijayawada', 'third molar extraction Vijayawada'], category: 'Oral Surgery' },
  { name: 'Tooth Extraction', keywords: ['tooth extraction Vijayawada', 'painless tooth extraction Vijayawada', 'surgical extraction Vijayawada', 'tooth removal Vijayawada', 'extraction cost Vijayawada', 'dental extraction Vijayawada', 'emergency tooth extraction Vijayawada'], category: 'Oral Surgery' },
  { name: 'Dental Cleaning and Scaling', keywords: ['dental cleaning Vijayawada', 'teeth cleaning Vijayawada', 'scaling Vijayawada', 'deep cleaning teeth Vijayawada', 'professional cleaning Vijayawada', 'ultrasonic scaling Vijayawada', 'dental scaling cost Vijayawada'], category: 'Preventive Dentistry' },
  { name: 'Gum Treatment', keywords: ['gum treatment Vijayawada', 'gum disease treatment Vijayawada', 'periodontal treatment Vijayawada', 'gum surgery Vijayawada', 'gum bleeding treatment Vijayawada', 'gingivitis treatment Vijayawada', 'gum specialist Vijayawada'], category: 'Periodontics' },
  { name: 'Smile Makeover', keywords: ['smile makeover Vijayawada', 'smile design Vijayawada', 'complete smile transformation Vijayawada', 'smile correction Vijayawada', 'smile enhancement Vijayawada', 'digital smile design Vijayawada', 'Hollywood smile makeover Vijayawada'], category: 'Cosmetic Dentistry' },
  { name: 'Dental Fillings', keywords: ['dental filling Vijayawada', 'tooth filling Vijayawada', 'cavity filling Vijayawada', 'filling cost Vijayawada', 'composite filling Vijayawada', 'tooth colored filling Vijayawada', 'cavity treatment Vijayawada'], category: 'Restorative Dentistry' },
  { name: 'Fluoride Treatment', keywords: ['fluoride treatment Vijayawada', 'fluoride therapy Vijayawada', 'topical fluoride Vijayawada', 'fluoride application Vijayawada', 'fluoride for kids Vijayawada', 'fluoride varnish Vijayawada', 'cavity prevention fluoride Vijayawada'], category: 'Preventive Dentistry' },
  { name: 'Dental Checkup', keywords: ['dental checkup Vijayawada', 'dental examination Vijayawada', 'routine dental checkup Vijayawada', 'dental consultation Vijayawada', 'comprehensive dental exam Vijayawada', 'dental screening Vijayawada', 'oral health checkup Vijayawada'], category: 'Preventive Dentistry' },
  { name: 'Pediatric Dentistry', keywords: ['pediatric dentist Vijayawada', 'kids dentist Vijayawada', 'children dental care Vijayawada', 'kids dental treatment Vijayawada', 'child dentist Vijayawada', 'pediatric dental clinic Vijayawada', 'baby teeth care Vijayawada'], category: 'Pediatric Dentistry' },
  { name: 'Dental Sealants', keywords: ['dental sealants Vijayawada', 'pit and fissure sealants Vijayawada', 'sealant for kids Vijayawada', 'tooth sealant Vijayawada', 'sealant treatment Vijayawada', 'cavity prevention sealants Vijayawada', 'dental sealant cost Vijayawada'], category: 'Pediatric Dentistry' },
  { name: 'Teeth Bonding', keywords: ['teeth bonding Vijayawada', 'dental bonding Vijayawada', 'tooth bonding Vijayawada', 'composite bonding Vijayawada', 'bonding cost Vijayawada', 'chipped tooth repair Vijayawada', 'dental bonding treatment Vijayawada'], category: 'Cosmetic Dentistry' },
  { name: 'Dental X-Ray', keywords: ['dental X-ray Vijayawada', 'digital X-ray Vijayawada', 'dental radiography Vijayawada', 'OPG X-ray Vijayawada', 'CBCT scan Vijayawada', 'dental imaging Vijayawada', 'X-ray cost Vijayawada'], category: 'Diagnostic' },
  { name: 'Oral Cancer Screening', keywords: ['oral cancer screening Vijayawada', 'oral cancer detection Vijayawada', 'mouth cancer check Vijayawada', 'oral cancer test Vijayawada', 'oral cancer specialist Vijayawada', 'oral pathology Vijayawada', 'oral health screening Vijayawada'], category: 'Diagnostic' },
  { name: 'Sensitive Teeth Treatment', keywords: ['sensitive teeth treatment Vijayawada', 'tooth sensitivity Vijayawada', 'sensitivity treatment Vijayawada', 'teeth sensitivity dentist Vijayawada', 'desensitizing treatment Vijayawada', 'sensitive teeth remedy Vijayawada', 'tooth pain cold water Vijayawada'], category: 'General Dentistry' },
  { name: 'Bad Breath Treatment', keywords: ['bad breath treatment Vijayawada', 'halitosis treatment Vijayawada', 'bad breath cure Vijayawada', 'bad breath dentist Vijayawada', 'chronic bad breath Vijayawada', 'bad breath clinic Vijayawada', 'oral malodor treatment Vijayawada'], category: 'General Dentistry' },
  { name: 'Jaw Pain Treatment', keywords: ['jaw pain treatment Vijayawada', 'TMJ treatment Vijayawada', 'jaw joint pain Vijayawada', 'TMJ disorder Vijayawada', 'jaw pain dentist Vijayawada', 'temporomandibular joint Vijayawada', 'jaw clicking treatment Vijayawada'], category: 'Oral Surgery' },
  { name: 'Gum Grafting', keywords: ['gum grafting Vijayawada', 'gum recession treatment Vijayawada', 'gum graft surgery Vijayawada', 'gum recession dentist Vijayawada', 'gum tissue graft Vijayawada', 'gingival graft Vijayawada', 'gum lift Vijayawada'], category: 'Periodontics' },
  { name: 'Laser Dentistry', keywords: ['laser dentistry Vijayawada', 'dental laser treatment Vijayawada', 'laser gum treatment Vijayawada', 'laser tooth whitening Vijayawada', 'laser cavity removal Vijayawada', 'painless laser dentistry Vijayawada', 'laser dental clinic Vijayawada'], category: 'General Dentistry' },
  { name: 'Full Mouth Rehabilitation', keywords: ['full mouth rehabilitation Vijayawada', 'full mouth rehabilitation cost Vijayawada', 'complete dental rehabilitation Vijayawada', 'full mouth restoration Vijayawada', 'full mouth makeover Vijayawada', 'smile rehabilitation Vijayawada', 'comprehensive dental treatment Vijayawada'], category: 'Restorative Dentistry' },
  { name: 'Emergency Dental Care', keywords: ['emergency dentist Vijayawada', 'emergency dental care Vijayawada', '24 hour dentist Vijayawada', 'urgent dental treatment Vijayawada', 'dental emergency Vijayawada', 'emergency tooth pain Vijayawada', 'after hours dentist Vijayawada'], category: 'Emergency Care' },
  { name: 'Dental Tourism', keywords: ['dental tourism Vijayawada', 'dental tourism India', 'affordable dental treatment Vijayawada', 'dental holiday Vijayawada', 'dental treatment packages Vijayawada', 'medical tourism dental Vijayawada', 'dental tourism Andhra Pradesh'], category: 'General Dentistry' },
];

// ============================================
// ARTICLE TITLE TEMPLATES PER ANGLE
// ============================================
const TITLE_ANGLES = [
  // Informational / Guide
  (t: string, kw: string) => `Complete Guide to ${t} in Vijayawada - What Every Patient Must Know`,
  (t: string, kw: string) => `${t} in Vijayawada: A Comprehensive Patient Handbook for ${new Date().getFullYear()}`,
  (t: string, kw: string) => `Everything You Need to Know About ${t} at Mouth Care Solutions Vijayawada`,
  (t: string, kw: string) => `The Ultimate ${t} Guide for Residents of Vijayawada and Andhra Pradesh`,
  (t: string, kw: string) => `${t} Explained: Step-by-Step Process, Recovery, and Results in Vijayawada`,
  (t: string, kw: string) => `What to Expect During ${t} at Our Vijayawada Dental Clinic`,
  (t: string, kw: string) => `Patient Education: Understanding ${t} and Its Benefits for Oral Health`,
  (t: string, kw: string) => `${t} FAQs: Top 20 Questions Answered by Vijayawada Dentists`,
  (t: string, kw: string) => `How ${t} Works: The Science Behind Modern Dental Treatment in Vijayawada`,
  (t: string, kw: string) => `Who Needs ${t}? Signs, Symptoms, and When to See a Dentist in Vijayawada`,
  // Cost / Affordability
  (t: string, kw: string) => `${t} Cost in Vijayawada ${new Date().getFullYear()} - Transparent Pricing Guide`,
  (t: string, kw: string) => `How Much Does ${t} Cost in Vijayawada? Complete Price Breakdown`,
  (t: string, kw: string) => `Affordable ${t} in Vijayawada: Quality Dental Care Within Your Budget`,
  (t: string, kw: string) => `${t} Price Comparison: Vijayawada vs Other Cities in Andhra Pradesh`,
  (t: string, kw: string) => `Insurance Coverage for ${t} in Vijayawada - What You Need to Know`,
  (t: string, kw: string) => `Is ${t} Covered Under Health Insurance in Vijayawada? Complete Guide`,
  (t: string, kw: string) => `${t} Cost Without Insurance in Vijayawada: Affordable Payment Options`,
  (t: string, kw: string) => `EMI and Payment Plans for ${t} at Mouth Care Solutions Vijayawada`,
  // Before/After / Results
  (t: string, kw: string) => `${t} Before and After: Real Results from Mouth Care Solutions Vijayawada`,
  (t: string, kw: string) => `What Results Can You Expect from ${t}? Timeframe and Success Rates`,
  (t: string, kw: string) => `How Long Do ${t} Results Last? Long-Term Outcomes Explained`,
  (t: string, kw: string) => `${t} Success Stories: Transforming Smiles at Our Vijayawada Clinic`,
  (t: string, kw: string) => `Recovery After ${t}: Timeline, Tips, and What to Avoid`,
  (t: string, kw: string) => `${t} Aftercare: How to Maintain Results for Years in Vijayawada`,
  // Comparison
  (t: string, kw: string) => `${t} vs Alternatives: Which Dental Treatment is Best for You in Vijayawada?`,
  (t: string, kw: string) => `Comparing ${t} Options: Pros, Cons, and Recommendations for Vijayawada Patients`,
  (t: string, kw: string) => `${t}: Which Type is Right for You? Expert Advice from Vijayawada Dentists`,
  // Pain / Comfort
  (t: string, kw: string) => `Is ${t} Painful? Honest Truth from Vijayawada Dental Patients`,
  (t: string, kw: string) => `Painless ${t} in Vijayawada: How We Make Your Visit Comfortable`,
  (t: string, kw: string) => `Anesthesia Options for ${t}: What Vijayawada Patients Should Know`,
  (t: string, kw: string) => `Managing Dental Anxiety During ${t}: Tips from Our Vijayawada Specialists`,
  // Doctor / Clinic specific
  (t: string, kw: string) => `Best ${t} Dentist in Vijayawada: Why Patients Choose Mouth Care Solutions`,
  (t: string, kw: string) => `Top-Rated ${t} Clinic in Vijayawada: Mouth Care Solutions Review`,
  (t: string, kw: string) => `${t} at Mouth Care Solutions: Technology, Expertise, and Patient Experience`,
  (t: string, kw: string) => `Why Mouth Care Solutions is the Best Clinic for ${t} in Andhra Pradesh`,
  (t: string, kw: string) => `Meet Our ${t} Specialists: Expert Dentists at Mouth Care Solutions Vijayawada`,
  // Seasonal / Timely
  (t: string, kw: string) => `Why Winter is the Best Time for ${t} in Vijayawada`,
  (t: string, kw: string) => `Summer Dental Care: Is ${t} Right for You This Season in Vijayawada?`,
  (t: string, kw: string) => `${new Date().getFullYear()} Trends in ${t}: What Vijayawada Dentists Are Recommending`,
  // Lifestyle / Diet
  (t: string, kw: string) => `Foods to Eat and Avoid After ${t}: Diet Guide for Vijayawada Patients`,
  (t: string, kw: string) => `How ${t} Improves Your Daily Life: Eating, Speaking, and Confidence`,
  (t: string, kw: string) => `Oral Hygiene Tips After ${t}: Maintaining Your Dental Health in Vijayawada`,
  // Myths / Facts
  (t: string, kw: string) => `${t} Myths vs Facts: What Vijayawada Patients Get Wrong`,
  (t: string, kw: string) => `Common Misconceptions About ${t} Debunked by Vijayawada Dentists`,
  (t: string, kw: string) => `5 Dangerous Myths About ${t} That Could Harm Your Teeth`,
  // Specific demographics
  (t: string, kw: string) => `${t} for Seniors in Vijayawada: Special Considerations and Care`,
  (t: string, kw: string) => `${t} for Children: What Parents in Vijayawada Need to Know`,
  (t: string, kw: string) => `${t} for Adults Over 40: Dental Health in Your Prime Years in Vijayawada`,
  (t: string, kw: string) => `${t} for Diabetic Patients in Vijayawada: Safety and Precautions`,
  (t: string, kw: string) => `${t} During Pregnancy: Is It Safe? Advice from Vijayawada Dentists`,
  // Technology / Advances
  (t: string, kw: string) => `Latest Technology in ${t}: How Vijayawada Clinics Are Advancing Dental Care`,
  (t: string, kw: string) => `Advanced ${t} Techniques at Mouth Care Solutions Vijayawada`,
  (t: string, kw: string) => `Digital ${t}: How Technology is Improving Outcomes in Vijayawada`,
  // Preparation
  (t: string, kw: string) => `How to Prepare for ${t}: A Pre-Treatment Checklist for Vijayawada Patients`,
  (t: string, kw: string) => `What to Bring to Your ${t} Appointment at Mouth Care Solutions Vijayawada`,
  (t: string, kw: string) => `Questions to Ask Your Dentist Before ${t} in Vijayawada`,
  // Complications / Risks
  (t: string, kw: string) => `Possible Complications of ${t} and How Vijayawada Dentists Prevent Them`,
  (t: string, kw: string) => `Is ${t} Safe? Risks, Side Effects, and Safety Protocols in Vijayawada`,
  (t: string, kw: string) => `When to Seek Help After ${t}: Warning Signs Vijayawada Patients Should Know`,
  // Prevention
  (t: string, kw: string) => `How to Avoid Needing ${t}: Prevention Tips from Vijayawada Dental Experts`,
  (t: string, kw: string) => `Long-Term Oral Health: How ${t} Fits Into Your Dental Care Routine in Vijayawada`,
  // Local SEO heavy
  (t: string, kw: string) => `Top 10 ${t} Clinics in Vijayawada: Why Mouth Care Solutions Leads the List`,
  (t: string, kw: string) => `${t} Near Me in Vijayawada: Finding the Best Dental Care in Suryaraopeta`,
  (t: string, kw: string) => `Best ${t} in Andhra Pradesh: Why Vijayawada Patients Trust Mouth Care Solutions`,
  (t: string, kw: string) => `${t} in Suryaraopeta, Vijayawada: Convenient Location, Expert Care`,
  (t: string, kw: string) => `Looking for ${t}? Visit Mouth Care Solutions in Bhavani Complex, Vijayawada`,
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 150);
}

function generateAllTopics(): { title: string; category: string; keyword: string; treatment: string }[] {
  const topics: { title: string; category: string; keyword: string; treatment: string }[] = [];
  const usedTitles = new Set<string>();

  for (const treatment of TREATMENTS) {
    const articleCount = 60 + Math.floor(Math.random() * 60); // 60-120 per treatment
    const shuffledAngles = [...TITLE_ANGLES].sort(() => Math.random() - 0.5);
    const shuffledKeywords = [...treatment.keywords].sort(() => Math.random() - 0.5);

    for (let i = 0; i < articleCount; i++) {
      const angleFn = shuffledAngles[i % shuffledAngles.length];
      const keyword = shuffledKeywords[i % shuffledKeywords.length];
      let title = angleFn(treatment.name, keyword);

      // Add number suffix for duplicate angles
      const baseTitle = title;
      let suffix = 1;
      while (usedTitles.has(title)) {
        title = `${baseTitle} - Part ${suffix}`;
        suffix++;
      }
      usedTitles.add(title);
      topics.push({ title, category: treatment.category, keyword, treatment: treatment.name });
    }
  }
  return topics;
}

async function generateDetailedPost(zai: any, topic: { title: string; category: string; keyword: string; treatment: string }): Promise<{ content: string; metaDesc: string; excerpt: string; metaTitle: string } | null> {
  const prompt = `You are a professional dental health content writer for Mouth Care Solutions, a leading dental clinic in Vijayawada, Andhra Pradesh, India. Write a detailed, SEO-optimized blog article.

ARTICLE TITLE: ${topic.title}
TREATMENT: ${topic.treatment}
TARGET KEYWORD: ${topic.keyword}
SECONDARY KEYWORDS: dentist in Vijayawada, dental clinic Vijayawada, best dentist Vijayawada, ${topic.treatment.toLowerCase()} Vijayawada
CATEGORY: ${topic.category}
CLINIC: Mouth Care Solutions, Door No. 29-28-23, Bhavani Complex, Suryaraopeta, Vijayawada, Andhra Pradesh 520002
PHONE: +91 9866344866

WRITING REQUIREMENTS (STRICTLY FOLLOW):
1. Write 800-1200 words of detailed, informative content
2. Write in large, detailed paragraphs (4-6 sentences each minimum)
3. Use the target keyword "${topic.keyword}" naturally 5-8 times throughout
4. Mention "Vijayawada" at least 5-6 times
5. Mention "Andhra Pradesh" 2-3 times
6. Mention "Mouth Care Solutions" 2-3 times
7. Include related dental terms naturally
8. Write in professional but warm, patient-friendly tone
9. Include 4-6 subheadings using ## format that are descriptive and keyword-rich
10. Include practical tips, advice, and actionable information
11. Discuss the treatment process, benefits, recovery, and cost considerations
12. Reference the clinic location in Suryaraopeta, Vijayawada
13. End with: "Visit Mouth Care Solutions, Vijayawada, for expert ${topic.treatment.toLowerCase()}. Call 9866344866 or WhatsApp +91 9866344866 to book your appointment today!"
14. DO NOT use bullet points or numbered lists - use flowing paragraphs only
15. DO NOT use any markdown formatting other than ## for subheadings
16. Every paragraph must be substantial (at least 3-4 sentences)

Return ONLY valid JSON (no markdown fences, no extra text):
{"content": "<the full article with ## subheadings>", "metaDesc": "<compelling 155-160 character SEO meta description>", "excerpt": "<2-3 detailed sentences summarizing the article, 40-60 words>", "metaTitle": "<SEO title tag under 60 characters>"}`;

  try {
    const response = await zai.chat.completions.create({
      model: 'glm-4-flash',
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = response.choices[0]?.message?.content?.trim() || '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.content && parsed.content.length > 300) return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  const target = parseInt(process.argv[2] || '2000', 10);
  console.log(`Generating ${target} detailed SEO blog posts...`);
  console.log(`Treatments: ${TREATMENTS.length}, Title angles: ${TITLE_ANGLES.length}`);
  
  const zai = await ZAI.create();
  const allTopics = generateAllTopics();
  console.log(`Generated ${allTopics.length} unique topic ideas`);
  
  // Shuffle and take target count
  const topics = allTopics.sort(() => Math.random() - 0.5).slice(0, target);
  
  let created = 0;
  let errors = 0;
  const BATCH_SIZE = 3; // Smaller batches for longer content
  
  for (let i = 0; i < topics.length; i += BATCH_SIZE) {
    const batch = topics.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (topic) => {
        const data = await generateDetailedPost(zai, topic);
        if (!data) return null;
        
        return prisma.blogPost.create({
          data: {
            slug: slugify(topic.title),
            title: topic.title,
            metaTitle: data.metaTitle,
            metaDesc: data.metaDesc,
            content: data.content,
            excerpt: data.excerpt,
            category: topic.category,
            keywords: topic.keyword,
            author: 'Mouth Care Solutions',
            scheduledAt: new Date(Date.now() + created * 24 * 60 * 60 * 1000),
          },
        });
      })
    );
    
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) created++;
      else errors++;
    }
    
    const pct = Math.round(((i + BATCH_SIZE) / topics.length) * 100);
    console.log(`[${pct}%] ${Math.min(i + BATCH_SIZE, topics.length)}/${topics.length} | Created: ${created} | Errors: ${errors}`);
    
    if (i + BATCH_SIZE < topics.length) {
      await new Promise(r => setTimeout(r, 4000)); // Longer delay for detailed content
    }
  }
  
  console.log(`\nDONE! Created: ${created}, Errors: ${errors}, Target: ${target}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
