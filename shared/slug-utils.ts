import type { Property } from './schema';

// Common ID patterns used in the system
const LEGACY_ID_PATTERNS = [
  /^prop-\d+$/, // Pattern like "prop-1000"
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // UUID pattern
  /^\d+$/ // Simple numeric IDs
];

// Arabic to Latin transliteration map
const arabicToLatin: { [key: string]: string } = {
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
  'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
  'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
  'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
  'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'و': 'w', 'ي': 'y', 'ة': 'a',
  'ى': 'a', 'ئ': 'e', 'ء': ''
};

// Kurdish (Sorani) to Latin transliteration map
const kurdishToLatin: { [key: string]: string } = {
  'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't',
  'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ر': 'r', 'ڕ': 'rr', 'ز': 'z',
  'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ع': 'a',
  'غ': 'gh', 'ف': 'f', 'ڤ': 'v', 'ق': 'q',
  'ک': 'k', 'گ': 'g', 'ل': 'l', 'ڵ': 'll',
  'م': 'm', 'ن': 'n', 'ڶ': 'nn', 'ه': 'h',
  'ھ': 'h', 'و': 'w', 'ی': 'y',
  'ێ': 'e', 'ە': 'a', 'ۆ': 'o', 'ۇ': 'u'
};

// Unicode ranges for script detection
const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F]/;
const KURDISH_RANGE = /[\u06C0-\u06FF\u0750-\u077F]|[\u0695\u0698\u06a4\u06af\u06b5\u06d5]/;

/**
 * Detects if text contains Arabic script
 */
function hasArabicScript(text: string): boolean {
  return ARABIC_RANGE.test(text);
}

/**
 * Detects if text contains Kurdish script
 */
function hasKurdishScript(text: string): boolean {
  return KURDISH_RANGE.test(text);
}

/**
 * Transliterates Arabic text to Latin characters
 */
function transliterateArabic(text: string): string {
  // Normalize text first
  const normalized = text.normalize('NFKD');
  return normalized
    .split('')
    .map(char => arabicToLatin[char] || char)
    .join('')
    .replace(/[\u064b\u064c\u064d\u064e\u064f\u0650\u0651\u0652]/g, '') // Remove Arabic diacritics
    .trim();
}

/**
 * Transliterates Kurdish text to Latin characters
 */
function transliterateKurdish(text: string): string {
  // Normalize text first
  const normalized = text.normalize('NFKD');
  return normalized
    .split('')
    .map(char => kurdishToLatin[char] || char)
    .join('')
    .trim();
}

/**
 * Smart transliteration based on script detection
 */
function smartTransliterate(text: string): string {
  if (hasKurdishScript(text)) {
    return transliterateKurdish(text);
  } else if (hasArabicScript(text)) {
    return transliterateArabic(text);
  }
  return text;
}

/**
 * Cleans and formats text for URL slugs
 */
function cleanSlugText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Only allow letters, numbers, spaces, hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim()
    .substring(0, 100); // Cap at 100 characters
}

/**
 * Generates a comprehensive SEO-friendly slug from property data
 */
export function generatePropertySlug(property: Property | Partial<Property>): string {
  const parts: string[] = [];
  
  // Add city (smart transliterated)
  if (property.city) {
    const citySlug = smartTransliterate(property.city);
    const cleanCity = cleanSlugText(citySlug);
    if (cleanCity) {
      parts.push(cleanCity);
    }
  }
  
  // Add bedroom count if available
  if (property.bedrooms && property.bedrooms > 0) {
    parts.push(`${property.bedrooms}-bedroom`);
  }
  
  // Add property type (smart transliterated)
  if (property.type) {
    const typeSlug = smartTransliterate(property.type);
    const cleanType = cleanSlugText(typeSlug);
    if (cleanType) {
      parts.push(cleanType);
    }
  }
  
  // Add listing type context
  if (property.listingType) {
    const listingTypeMap: { [key: string]: string } = {
      'sale': 'for-sale',
      'rent': 'for-rent'
    };
    parts.push(listingTypeMap[property.listingType] || property.listingType);
  }
  
  // If we don't have enough parts, add a portion of the title
  if (parts.length < 3 && property.title) {
    const titleSlug = smartTransliterate(property.title);
    
    // Take first 3 meaningful words from title
    const titleWords = cleanSlugText(titleSlug)
      .split('-')
      .filter(word => word.length > 2) // Filter out small words
      .slice(0, 3);
    
    parts.push(...titleWords);
  }
  
  // Ensure we have a fallback
  if (parts.length === 0) {
    parts.push('property');
  }
  
  return parts.join('-');
}

/**
 * Generates a unique slug by appending a counter if needed
 */
export function generateUniqueSlug(
  baseSlug: string, 
  checkSlugExists: (slug: string) => boolean,
  currentPropertyId?: string
): string {
  let slug = baseSlug;
  let counter = 1;
  
  // Check if the slug already exists (excluding current property)
  while (checkSlugExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
    // Prevent infinite loops
    if (counter > 1000) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }
  
  return slug;
}

/**
 * Extracts property ID from a slug-based URL
 * Handles both new slug format and old ID format for backward compatibility
 */
export function extractPropertyIdentifier(urlParam: string): { 
  isSlug: boolean; 
  identifier: string; 
} {
  // Check if it matches any known legacy ID patterns
  for (const pattern of LEGACY_ID_PATTERNS) {
    if (pattern.test(urlParam)) {
      return { isSlug: false, identifier: urlParam };
    }
  }
  
  // It's a slug (new format)
  return { isSlug: true, identifier: urlParam };
}

/**
 * Validates if a slug is well-formed
 */
export function isValidSlug(slug: string): boolean {
  // Should not be empty, contain only letters, numbers, and hyphens
  // Should not start or end with hyphen
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 100;
}

/**
 * Checks if a string is a legacy ID format
 */
export function isLegacyId(identifier: string): boolean {
  return LEGACY_ID_PATTERNS.some(pattern => pattern.test(identifier));
}

/**
 * Formats a slug for display (converts hyphens to spaces and capitalizes)
 */
export function formatSlugForDisplay(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generates example SEO-friendly URLs for demonstration
 */
export function generateExampleUrls(): string[] {
  return [
    '/property/erbil-3-bedroom-apartment-for-sale',
    '/property/baghdad-2-bedroom-house-for-rent',
    '/property/sulaymaniyah-4-bedroom-villa-for-sale',
    '/property/duhok-1-bedroom-apartment-for-rent',
    '/property/zakho-commercial-land-for-sale'
  ];
}