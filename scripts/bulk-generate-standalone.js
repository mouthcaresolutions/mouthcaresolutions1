/**
 * Standalone Bulk Blog Generator
 * Run from YOUR computer (where Gemini API works)
 *
 * STEPS:
 * 1. Open CMD/terminal in your project folder
 * 2. Run:
 *    node scripts/bulk-generate-standalone.js YOUR_GEMINI_KEY admin YOUR_PASSWORD
 *
 * Example:
 *    node scripts/bulk-generate-standalone.js YOUR_GEMINI_KEY admin YOUR_PASSWORD
 */

const fs = require('fs');
const path = require('path');

const SITE = 'https://mouthcaresolutions.com';
const RATE_MS = 5000;
const PF = path.join(__dirname, 'bulk-progress.json');

// ======== LOAD TITLES FROM MAIN SCRIPT ========
// Parse the TREATMENTS array from bulk-1000-posts.js
const mainScript = fs.readFileSync(path.join(__dirname, 'bulk-1000-posts.js'), 'utf-8');
const TREATMENTS = eval('[' + mainScript.split('const TREATMENTS = [')[1].split('];\n\n// ========================')[0] + ']');

console.log(`Loaded ${TREATMENTS.length} treatments with ${TREATMENTS.reduce((s,t) => s + t.titles.length, 0)} total titles`);

// ======== PROMPT BUILDER ========
function buildPrompt(title, treatment, keywords, category) {
  return `You are a professional dental content writer for Mouth Care Solutions, a leading multi-specialty dental clinic in Vijayawada, Andhra Pradesh, India. Write a comprehensive, SEO-optimized, long-form article.

TITLE: ${title}

PRIMARY KEYWORDS: ${keywords.join(', ')}
SECONDARY KEYWORDS: dentist in Vijayawada, dental clinic Vijayawada, best dentist Vijayawada, Mouth Care Solutions, dental treatment Vijayawada, tooth doctor near me, dental care Andhra Pradesh, dental hospital Vijayawada
CATEGORY: ${category}

CRITICAL CONTENT REQUIREMENTS:
1. The article MUST be between 2,500 and 5,000 words. This is non-negotiable.
2. Every paragraph MUST have at least 4-6 substantial sentences. Never write short 1-2 sentence paragraphs.
3. Write in a professional yet warm and accessible tone, targeting patients in Vijayawada and Andhra Pradesh.
4. Include the city name "Vijayawada" naturally 8-12 times throughout the article.
5. Mention "Mouth Care Solutions" 3-4 times as the expert clinic offering this treatment.
6. Include specific, realistic details: costs in INR ranges (e.g., Rs.3,000-8,000 for basic, Rs.15,000-40,000 for advanced), procedure duration in minutes/hours/visits, recovery timelines in days/weeks.
7. Use H2 (## Heading) for major sections and H3 (### Heading) for subsections — at least 8-10 H2 sections.
8. Include a detailed FAQ section with 7-10 common questions, each with comprehensive multi-sentence answers.
9. Include: "Why Choose Mouth Care Solutions for ${treatment.name} in Vijayawada" section with clinic details.
10. Write in clean markdown format.
11. Naturally weave in ALL keywords without stuffing.
12. Include patient experiences, real-world scenarios, and practical advice.
13. Add cost and payment options section with EMI if applicable.
14. Include what makes this treatment at Mouth Care Solutions different.

STRUCTURE:
# ${title}
## What is ${treatment.name}? (5-6 paragraphs)
## Why is ${treatment.name} Important? (4-5 paragraphs)
## Signs You Need ${treatment.name} (4-5 paragraphs)
## Types of ${treatment.name} (3-4 paragraphs)
## The ${treatment.name} Procedure: Step by Step (6-8 paragraphs)
## ${treatment.name} Cost in Vijayawada (4-5 paragraphs with INR prices)
## Benefits of ${treatment.name} (3-4 paragraphs)
## ${treatment.name} Recovery and Aftercare (4-5 paragraphs)
## Risks and Complications (2-3 paragraphs)
## Why Choose Mouth Care Solutions for ${treatment.name} in Vijayawada (3-4 paragraphs)
## Patient Experience at Mouth Care Solutions (2-3 paragraphs)
## Frequently Asked Questions (7-10 detailed Q&A)

Write the COMPLETE article now. Minimum 2,500 words.`;
}

async function callGemini(prompt, apiKey) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.85, maxOutputTokens: 8192 } }),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).substring(0, 200)}`);
  return r.json()?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function words(t) { return t.split(/\s+/).filter(Boolean).length; }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const [apiKey, username, password] = process.argv.slice(2);
  if (!apiKey || !username || !password) {
    console.log('\nUsage: node scripts/bulk-generate-standalone.js GEMINI_KEY USERNAME PASSWORD\n');
    console.log('Example: node scripts/bulk-generate-standalone.js AQ.Ab8RN... admin YourPassword\n');
    process.exit(1);
  }

  // Test Gemini
  console.log('Testing Gemini API...');
  try { await callGemini('Say OK', apiKey); console.log('Gemini: Working!'); }
  catch (e) { console.error('Gemini failed:', e.message); process.exit(1); }

  // Login
  console.log('Logging in...');
  let token;
  try {
    const r = await fetch(`${SITE}/api/admin/auth`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password }),
    });
    const d = await r.json();
    if (!d.token) throw new Error(d.error || 'Login failed');
    token = d.token; console.log('Login: Success!');
  } catch (e) { console.error('Login failed:', e.message); process.exit(1); }

  // Build flat list
  const all = [];
  for (const t of TREATMENTS) for (const title of t.titles) all.push({ title, t, cat: t.category, kw: t.keywords });
  // Shuffle
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }

  // Progress
  let done = new Set();
  if (fs.existsSync(PF)) { const p = JSON.parse(fs.readFileSync(PF, 'utf-8')); done = new Set(p.done || []); console.log(`Resuming: ${done.size} already done`); }
  const remaining = all.filter(p => !done.has(p.title));
  console.log(`\nTo generate: ${remaining.length}`);
  console.log(`Est. time: ${Math.round(remaining.length * RATE_MS / 60000)} minutes\n`);
  if (!remaining.length) { console.log('All done!'); return; }

  let ok = 0, fail = 0; const t0 = Date.now();
  for (let i = 0; i < remaining.length; i++) {
    const p = remaining[i];
    console.log(`[${i+1}/${remaining.length}] ${p.title}`);
    try {
      let content = await callGemini(buildPrompt(p.title, p.t, p.kw, p.cat), apiKey);
      let wc = words(content);
      if (wc < 2000) {
        console.log(`  Short (${wc}), retrying...`);
        content = await callGemini(buildPrompt(p.title, p.t, p.kw, p.cat) + '\n\nMUST write 3,000+ words minimum. Expand every section.', apiKey);
        wc = words(content);
      }
      const firstP = content.split('\n\n').find(x => x.length > 100 && !x.startsWith('#')) || '';
      const r = await fetch(`${SITE}/api/admin/posts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: p.title, content, excerpt: firstP.substring(0, 300), metaDesc: firstP.substring(0, 160), metaTitle: p.title, category: p.cat, keywords: p.kw.join(', '), status: 'published', author: 'Mouth Care Solutions' }),
      });
      if (!r.ok) throw new Error(`Save ${r.status}`);
      ok++; done.add(p.title);
      console.log(`  OK! (${wc} words) [${ok} done, ${fail} fail]`);
    } catch (e) { fail++; console.error(`  FAIL: ${e.message}`); }
    if (i % 5 === 0) fs.writeFileSync(PF, JSON.stringify({ done: [...done], ok, fail, at: new Date().toISOString() }));
    if (i < remaining.length - 1) await sleep(RATE_MS);
  }
  console.log(`\n=== DONE! Created: ${ok}, Failed: ${fail}, Time: ${((Date.now()-t0)/60000).toFixed(1)} min ===`);
}
main().catch(e => { console.error(e); process.exit(1); });
