// Routing utilities for clean, SEO-friendly product URLs
// No external dependencies - pure vanilla implementation

import type { Product } from '../hooks/useProducts';

/**
 * Generate clean, SEO-friendly slug from product name or ID
 * Example: "Premium Wireless Headphones" → "wireless-headphones"
 */
export function generateSlug(product: Product): string {
  // Use product name for better SEO
  const slug = product.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')      // Spaces to hyphens
    .replace(/--+/g, '-')      // Multiple hyphens to single
    .replace(/^-+|-+$/g, '')   // Remove leading/trailing hyphens
    .substring(0, 50);         // Keep it short (max 50 chars)
  
  return slug || product.id; // Fallback to ID if slug is empty
}

/**
 * Build product URL path
 * Example: "wireless-headphones" → "/p/wireless-headphones"
 */
export function getProductPath(product: Product): string {
  const slug = generateSlug(product);
  return `/p/${slug}`;
}

/**
 * Build full product URL with domain
 */
export function getProductUrl(product: Product): string {
  const path = getProductPath(product);
  return `${window.location.origin}${path}`;
}

/**
 * Navigate to product page (updates URL without page reload)
 */
export function navigateToProduct(product: Product): void {
  const path = getProductPath(product);
  window.history.pushState({ productId: product.id }, '', path);
}

/**
 * Navigate to home page
 */
export function navigateToHome(): void {
  window.history.pushState({}, '', '/');
}

/**
 * Navigate to admin page
 */
export function navigateToAdmin(): void {
  window.history.pushState({}, '', '/admin');
}

/**
 * Check if current URL is a product page
 * Returns product slug if on product page, null otherwise
 */
export function getCurrentProductSlug(): string | null {
  const path = window.location.pathname;
  const match = path.match(/^\/p\/([^/]+)$/);
  return match ? match[1] : null;
}

/**
 * Check if current URL is admin page
 */
export function isAdminPath(): boolean {
  return window.location.pathname === '/admin' || window.location.pathname === '/admin/';
}

/**
 * Check if current URL is home page
 */
export function isHomePath(): boolean {
  return window.location.pathname === '/';
}

/**
 * Find product by slug in product array
 */
export function findProductBySlug(products: Product[], slug: string): Product | null {
  // First try exact slug match
  const exactMatch = products.find(p => generateSlug(p) === slug);
  if (exactMatch) return exactMatch;
  
  // Fallback: try matching by ID (in case someone uses /p/1 format)
  const idMatch = products.find(p => p.id === slug);
  return idMatch || null;
}

/**
 * Copy URL to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

/**
 * Share product via Web Share API (fallback to copy link)
 */
export async function shareProduct(product: Product): Promise<{ success: boolean; method: 'native' | 'clipboard' | 'failed' }> {
  const url = getProductUrl(product);
  const title = product.name;
  const text = `Check out ${product.name} - ₹${product.price}`;

  // Try native sharing first (mobile devices)
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { success: true, method: 'native' };
    } catch (error) {
      // User cancelled or error - fall through to clipboard
    }
  }

  // Fallback to clipboard
  const copied = await copyToClipboard(url);
  return { success: copied, method: copied ? 'clipboard' : 'failed' };
}
