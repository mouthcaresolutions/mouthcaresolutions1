/**
 * SEC-C04 FIX: Proper HTML sanitization using DOMPurify.
 * Replaces the previous regex-based sanitizer that was trivially bypassable.
 * 
 * DOMPurify uses a full HTML parser (DOM-based) to strip dangerous elements,
 * making it resistant to bypass via nested tags, SVG vectors, encoded URLs, etc.
 */
import DOMPurify from 'isomorphic-dompurify';

// Allow safe dental blog content: headings, paragraphs, lists, links, images,
// bold, italic, tables, blockquotes, code, hr, br, figure, figcaption
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

const ALLOWED_ATTR = [
  'href', 'target', 'rel',
  'src', 'alt', 'title', 'width', 'height', 'loading',
  'class', 'id', 'style',
  'colspan', 'rowspan',
];

const PURIFY_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: false,
  // Block all script-related content
  FORBID_TAGS: ['script', 'noscript', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button', 'svg', 'math'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onchange', 'oninput', 'onkeydown', 'onkeyup', 'onkeypress', 'onmousedown', 'onmouseup', 'ontouchstart', 'ontouchend', 'ontoggle', 'onbegin', 'onend', 'onrepeat'],
  // Allow only safe URL protocols
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
};

/**
 * Sanitize HTML content to prevent XSS while preserving safe blog content.
 * Uses DOMPurify with strict allowlist of tags and attributes.
 */
export function sanitizeContent(content: string): string {
  if (!content || typeof content !== 'string') return content || '';
  return DOMPurify.sanitize(content, PURIFY_CONFIG);
}

/**
 * Strip all HTML tags, returning plain text only.
 */
export function stripHtml(content: string): string {
  if (!content || typeof content !== 'string') return content || '';
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}
