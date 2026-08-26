/**
 * HTML sanitization for blog content using sanitize-html.
 * Replaces isomorphic-dompurify which had jsdom/ESM compatibility issues on Vercel.
 */
import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'small', 'sub', 'sup',
  'a',
  'img',
  'figure', 'figcaption',
  'ul', 'ol', 'li',
  'blockquote',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'code', 'pre',
  'div', 'span',
];

const ALLOWED_ATTRIBUTES = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  td: ['colspan'],
  th: ['colspan', 'rowspan'],
  '*': ['class', 'id', 'style'],
};

const PURIFY_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: ALLOWED_ATTRIBUTES,
  allowProtocolRelative: true,
  disallowedTagsMode: 'discard',
};

/**
 * Sanitize HTML content to prevent XSS while preserving safe blog content.
 */
export function sanitizeContent(content: string): string {
  if (!content || typeof content !== 'string') return content || '';
  return sanitizeHtml(content, PURIFY_CONFIG);
}

/**
 * Strip all HTML tags, returning plain text only.
 */
export function stripHtml(content: string): string {
  if (!content || typeof content !== 'string') return content || '';
  return sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} });
}
