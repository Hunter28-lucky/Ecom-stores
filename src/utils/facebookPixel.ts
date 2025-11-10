// Facebook Pixel Event Tracking Utility
// Comprehensive e-commerce event tracking for Meta Ads

declare global {
  interface Window {
    fbq: (track: string, event: string, params?: Record<string, any>) => void;
  }
}

/**
 * Check if Facebook Pixel is loaded
 */
export function isFacebookPixelLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
}

/**
 * Track page view (SPA navigation)
 */
export function trackPageView(): void {
  if (isFacebookPixelLoaded()) {
    window.fbq('track', 'PageView');
    console.log('📊 FB Pixel: PageView tracked');
  }
}

/**
 * Track when user views a product
 */
export function trackViewContent(product: {
  id: string;
  name: string;
  price: number;
  category: string;
}): void {
  if (!isFacebookPixelLoaded()) return;

  window.fbq('track', 'ViewContent', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    content_category: product.category,
    value: product.price,
    currency: 'INR',
  });
  
  console.log('📊 FB Pixel: ViewContent tracked', product.name);
}

/**
 * Track when user adds product to cart (clicks Buy Now)
 */
export function trackAddToCart(product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}): void {
  if (!isFacebookPixelLoaded()) return;

  window.fbq('track', 'AddToCart', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: product.price * product.quantity,
    currency: 'INR',
    num_items: product.quantity,
  });
  
  console.log('📊 FB Pixel: AddToCart tracked', product.name);
}

/**
 * Track when user starts checkout process
 */
export function trackInitiateCheckout(data: {
  productId: string;
  productName: string;
  value: number;
  quantity: number;
}): void {
  if (!isFacebookPixelLoaded()) return;

  window.fbq('track', 'InitiateCheckout', {
    content_ids: [data.productId],
    content_name: data.productName,
    content_type: 'product',
    value: data.value,
    currency: 'INR',
    num_items: data.quantity,
  });
  
  console.log('📊 FB Pixel: InitiateCheckout tracked', data.productName);
}

/**
 * Track when user selects payment method
 */
export function trackAddPaymentInfo(data: {
  productId: string;
  productName: string;
  value: number;
  paymentMethod: 'online' | 'cod';
}): void {
  if (!isFacebookPixelLoaded()) return;

  window.fbq('track', 'AddPaymentInfo', {
    content_ids: [data.productId],
    content_name: data.productName,
    content_type: 'product',
    value: data.value,
    currency: 'INR',
    payment_method: data.paymentMethod === 'online' ? 'UPI' : 'Cash on Delivery',
  });
  
  console.log('📊 FB Pixel: AddPaymentInfo tracked', data.paymentMethod);
}

/**
 * Track completed purchase (most important!)
 */
export function trackPurchase(data: {
  orderId: string;
  productId: string;
  productName: string;
  value: number;
  quantity: number;
  paymentMethod: 'online' | 'cod';
}): void {
  if (!isFacebookPixelLoaded()) return;

  window.fbq('track', 'Purchase', {
    content_ids: [data.productId],
    content_name: data.productName,
    content_type: 'product',
    value: data.value,
    currency: 'INR',
    num_items: data.quantity,
    // Custom parameters for better tracking
    order_id: data.orderId,
    payment_method: data.paymentMethod === 'online' ? 'UPI' : 'Cash on Delivery',
  });
  
  console.log('📊 FB Pixel: Purchase tracked', {
    orderId: data.orderId,
    value: data.value,
  });
}

/**
 * Track when user clicks Share button
 */
export function trackShare(product: {
  id: string;
  name: string;
  shareMethod: 'native' | 'clipboard';
}): void {
  if (!isFacebookPixelLoaded()) return;

  // Custom event for share tracking
  window.fbq('track', 'Share', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    share_method: product.shareMethod,
  });
  
  console.log('📊 FB Pixel: Share tracked', product.name);
}

/**
 * Track when user searches (if you add search later)
 */
export function trackSearch(searchQuery: string): void {
  if (!isFacebookPixelLoaded()) return;

  window.fbq('track', 'Search', {
    search_string: searchQuery,
  });
  
  console.log('📊 FB Pixel: Search tracked', searchQuery);
}

/**
 * Track custom conversion events
 */
export function trackCustomEvent(eventName: string, params?: Record<string, any>): void {
  if (!isFacebookPixelLoaded()) return;

  window.fbq('track', eventName, params);
  console.log('📊 FB Pixel: Custom event tracked', eventName, params);
}

/**
 * Track when user contacts via WhatsApp or email
 */
export function trackContact(method: 'whatsapp' | 'email' | 'phone'): void {
  if (!isFacebookPixelLoaded()) return;

  window.fbq('track', 'Contact', {
    contact_method: method,
  });
  
  console.log('📊 FB Pixel: Contact tracked', method);
}

/**
 * Track when user completes registration/signup (if you add it later)
 */
export function trackCompleteRegistration(method: string): void {
  if (!isFacebookPixelLoaded()) return;

  window.fbq('track', 'CompleteRegistration', {
    registration_method: method,
  });
  
  console.log('📊 FB Pixel: CompleteRegistration tracked', method);
}
