const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || '';

// Treatment-specific search queries for relevant dental images
const TREATMENT_QUERIES: Record<string, string> = {
  'root canal': 'root canal dental treatment',
  'dental implants': 'dental implant surgery',
  'teeth whitening': 'teeth whitening dental',
  'braces': 'orthodontic braces dental',
  'orthodontics': 'orthodontic braces treatment',
  'dentures': 'dentures dental prosthesis',
  'crown': 'dental crown procedure',
  'veneers': 'dental veneers cosmetic',
  'filling': 'dental filling cavity',
  'extraction': 'tooth extraction dental',
  'cleaning': 'dental cleaning scaling',
  'scaling': 'dental scaling cleaning',
  'gum': 'gum treatment periodontal',
  'pediatric': 'child dental care kid dentist',
  'children': 'pediatric dentistry child',
  'wisdom tooth': 'wisdom tooth extraction',
  'cosmetic': 'cosmetic dentistry smile',
  'alignment': 'teeth alignment orthodontic',
  'sensitivity': 'tooth sensitivity dental',
  'bad breath': 'dental hygiene oral care',
  'cavity': 'dental cavity tooth decay',
  ' fluoride': 'fluoride treatment dental',
  'invisalign': 'clear aligners invisalign',
  'bridge': 'dental bridge prosthesis',
};

// Verified Pexels image IDs for category fallbacks
const CATEGORY_FALLBACKS: Record<string, string> = {
  'Oral Hygiene': 'https://images.pexels.com/photos/5622020/pexels-photo-5622020.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Pediatric Dentistry': 'https://images.pexels.com/photos/52527/pexels-photo-52527.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Orthodontics': 'https://images.pexels.com/photos/6528861/pexels-photo-6528861.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Implants & Prosthodontics': 'https://images.pexels.com/photos/6502305/pexels-photo-6502305.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Preventive Dental Care': 'https://images.pexels.com/photos/6627484/pexels-photo-6627484.jpeg?auto=compress&cs=tinysrgb&w=800',
  'General Dentistry': 'https://images.pexels.com/photos/4045552/pexels-photo-4045552.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Cosmetic Dentistry': 'https://images.pexels.com/photos/6627572/pexels-photo-6627572.jpeg?auto=compress&cs=tinysrgb&w=800',
};

const DEFAULT_FALLBACK = 'https://images.pexels.com/photos/4045552/pexels-photo-4045552.jpeg?auto=compress&cs=tinysrgb&w=800';

/** Build a search query from treatment name and title */
function buildSearchQuery(treatmentName: string, title: string): string {
  const lower = (treatmentName + ' ' + title).toLowerCase();
  for (const [keyword, query] of Object.entries(TREATMENT_QUERIES)) {
    if (lower.includes(keyword)) return query;
  }
  // Generic dental query with some words from the title
  const words = title.split(/\s+/).slice(0, 3).join(' ');
  return `dental care ${words}`.trim();
}

/** Fetch image from Pexels API */
async function fetchFromPexels(query: string): Promise<string | null> {
  if (!PEXELS_API_KEY) return null;
  try {
    const page = Math.floor(Math.random() * 5) + 1; // random page for variety
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&page=${page}`,
      { headers: { Authorization: PEXELS_API_KEY }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.photos?.length > 0) {
      const photo = data.photos[Math.floor(Math.random() * Math.min(3, data.photos.length))];
      return photo.src?.medium || photo.src?.large || null;
    }
  } catch { /* ignore */ }
  return null;
}

/** Fetch image from Pixabay API */
async function fetchFromPixabay(query: string): Promise<string | null> {
  if (!PIXABAY_API_KEY) return null;
  try {
    const page = Math.floor(Math.random() * 3) + 1;
    const res = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=5&page=${page}&safesearch=true`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.hits?.length > 0) {
      const hit = data.hits[Math.floor(Math.random() * Math.min(3, data.hits.length))];
      return hit.webformatURL || null;
    }
  } catch { /* ignore */ }
  return null;
}

/** Get category fallback image URL */
export function getCategoryFallbackImage(category: string): string {
  return CATEGORY_FALLBACKS[category] || DEFAULT_FALLBACK;
}

/** Extract first <img src="..."> from HTML content */
export function extractImageFromContent(content: string): string | null {
  const match = content.match(/<img\s+[^>]*src=["']([^"']+)["']/i);
  return match?.[1] || null;
}

/** Fetch a unique blog image via Pexels -> Pixabay -> category fallback chain */
export async function fetchBlogImage(
  treatmentName: string,
  title: string,
  category: string
): Promise<string> {
  const query = buildSearchQuery(treatmentName, title);

  // Try Pexels first
  const pexels = await fetchFromPexels(query);
  if (pexels) return pexels;

  // Fallback to Pixabay
  const pixabay = await fetchFromPixabay(query);
  if (pixabay) return pixabay;

  // Final fallback: category-specific or default dental image
  return getCategoryFallbackImage(category);
}

/** Prepend an <img> tag to HTML/markdown content */
export function prependImageToContent(content: string, imageUrl: string, alt: string): string {
  // Don't add if already has an image
  if (content.match(/<img\s/i)) return content;
  return `<img src="${imageUrl}" alt="${alt}" />\n\n${content}`;
}
