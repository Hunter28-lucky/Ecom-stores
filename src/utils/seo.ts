// SEO utilities for dynamic meta tag updates
// Updates page title and meta descriptions based on product

import type { Product } from '../hooks/useProducts';

/**
 * Update page title dynamically
 */
export function updatePageTitle(title: string): void {
  document.title = title;
}

/**
 * Update meta description
 */
export function updateMetaDescription(description: string): void {
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', description);
}

/**
 * Update Open Graph tags for social sharing
 */
export function updateOpenGraphTags(product: Product, url: string): void {
  // OG Title
  updateMetaTag('og:title', product.name);
  
  // OG Description
  const description = product.description.substring(0, 200);
  updateMetaTag('og:description', description);
  
  // OG Image
  updateMetaTag('og:image', product.image);
  
  // OG URL
  updateMetaTag('og:url', url);
  
  // OG Type
  updateMetaTag('og:type', 'product');
  
  // Product-specific OG tags
  updateMetaTag('product:price:amount', product.price.toString());
  updateMetaTag('product:price:currency', 'INR');
}

/**
 * Helper to update or create meta tag
 */
function updateMetaTag(property: string, content: string): void {
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Set SEO for product page
 */
export function setProductSEO(product: Product, url: string): void {
  // Update title
  const title = `${product.name} - ₹${product.price} | Buy Online`;
  updatePageTitle(title);
  
  // Update description
  const description = `${product.description.substring(0, 150)}. Rated ${product.rating}⭐ (${product.reviews} reviews). Order now with secure payment!`;
  updateMetaDescription(description);
  
  // Update Open Graph tags for social sharing
  updateOpenGraphTags(product, url);
}

/**
 * Reset SEO to homepage defaults
 */
export function resetHomeSEO(): void {
  updatePageTitle('Premium Mobile Checkout - Shop Quality Products Online');
  updateMetaDescription('Shop premium quality products with secure UPI payment and Cash on Delivery. Fast delivery across India. Easy returns. 4.8⭐ rated by 2000+ customers.');
  
  // Reset OG tags to default
  updateMetaTag('og:title', 'Premium Mobile Checkout - Shop Quality Products Online');
  updateMetaTag('og:description', 'Shop premium quality products with secure payment options');
  updateMetaTag('og:url', window.location.origin);
  updateMetaTag('og:type', 'website');
}

/**
 * Reset SEO to admin page
 */
export function resetAdminSEO(): void {
  updatePageTitle('Admin Dashboard - Product Management');
  updateMetaDescription('Admin dashboard for managing products');
}
