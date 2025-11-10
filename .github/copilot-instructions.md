# Ecom-stores AI Coding Assistant Instructions

## Project Overview
Mobile-first e-commerce platform built with React + Vite + TypeScript, supporting dual payment flows: ZapUPI online payments and Cash on Delivery (COD). Features Google Sheets order management, admin product catalog, and comprehensive SEO optimization.

## Architecture & Critical Flows

### URL Routing & Direct Product Links
**Clean, professional URLs** without external router libraries:
- Format: `/p/{product-slug}` (e.g., `/p/apple-airpods-pro-2nd-generation`)
- Uses native History API (`pushState`, `popstate`) - no React Router
- Auto-generates SEO-friendly slugs from product names (max 50 chars)
- Deep linking: Direct product URLs work on page load
- Browser back/forward buttons fully supported
- Share functionality: Native mobile share API + clipboard fallback
- See `src/utils/routing.ts` and `PRODUCT_LINKS_GUIDE.md`

### Dual Backend Pattern
**Vercel serverless functions** (`api/`) and **Express proxy** (`server/index.mjs`) provide the same API endpoints:
- `/api/create-order` - Creates ZapUPI payment order
- `/api/order-status` - Polls payment status
- Vite dev proxy forwards to Express (port 4000), production uses Vercel functions
- **Critical**: ZapUPI credentials (`ZAPUPI_API_KEY`, `ZAPUPI_SECRET_KEY`) MUST stay server-side only

### Payment Flow Architecture
1. **Online UPI**: Customer → creates order → backend proxies to ZapUPI → QR code displayed → 10min payment window → status polling
2. **COD Flow**: Customer → validates → generates orderId → sends to Google Sheets → email confirmation → success screen
3. Both flows share customer validation and Google Sheets integration (`src/services/googleSheets.ts`)

### Google Sheets Integration
- Orders sent to Google Apps Script web app: `https://script.google.com/macros/s/AKfycbxVeet9UTsu10aUxFXiZ0BL3XJ4jPv6fs4IDHFsEtggN4jdWrGfTrHtdJswfdSK5vwG/exec`
- Script handles: order storage, admin email, WhatsApp notifications, COD confirmation emails
- See `GOOGLE_APPS_SCRIPT.js` for full backend logic including COD support
- `paymentMethod` field differentiates 'Online' vs 'COD' orders

## Developer Workflows

### Local Development
```bash
# Full stack (recommended)
npm run dev:full          # Starts Express proxy (4000) + Vite dev (5173)

# Or separately
npm run server            # Express proxy only
npm run dev               # Vite frontend only

# Admin mode (product management)
npm run dev:admin         # Admin API (3001) + Vite dev (5173)
npm run admin-api         # Admin API only
```

### Admin Product Management
- Access: Navigate to `/admin` or click "Admin" button
- Authentication: Stored in `sessionStorage` (see `AdminLogin.tsx`)
- Products: JSON file at `public/products.json` (served statically)
- Admin API (`server/admin-api.mjs`) provides CRUD endpoints for local development
- **Production limitation**: Vercel static hosting = read-only products (edit JSON manually)

### Deployment
```bash
npm run build             # Outputs to dist/
```
- Vercel config in `vercel.json` - SPA rewrites to `/index.html`
- Serverless functions in `api/` directory (Vercel auto-detects)
- Set environment variables in Vercel dashboard: `ZAPUPI_API_KEY`, `ZAPUPI_SECRET_KEY`

## Project-Specific Conventions

### State Management Pattern
- No external state library - React hooks + prop drilling
- `useState` for local UI state, `useEffect` for data fetching
- `sessionStorage` for admin auth and splash screen tracking
- See `App.tsx` for complex order flow state (payment window, status polling, timers)

### Payment Window & Polling
- ZapUPI orders expire after 10 minutes (`PAYMENT_WINDOW_SECONDS = 10 * 60`)
- Countdown timer updates every second via `setInterval`
- Status polling (every few seconds) checks order completion
- Payment expiry triggers UI state change (`paymentExpired = true`)

### CSS & Styling
- Tailwind CSS with custom config (`tailwind.config.js`)
- Mobile-first responsive design (breakpoints: sm, md, lg)
- Gradient patterns: `bg-gradient-to-br from-indigo-600 to-purple-600` (Online), `from-green-500 to-emerald-600` (COD)
- Lucide React for icons (imported individually)

### SEO Implementation
- All meta tags, JSON-LD structured data, and Open Graph in `index.html`
- **Dynamic SEO per product**: Page title and meta tags update via `src/utils/seo.ts`
- Hidden semantic content using `position: absolute; left: -9999px` (Google-approved)
- Structured data schemas: Product, AggregateRating, Review, Organization, BreadcrumbList, WebSite
- Files: `robots.txt`, `sitemap.xml` (includes all product URLs), `site.webmanifest` in `public/`
- See `SEO_GUIDE.md` and `DEPLOYMENT_SUMMARY.md` for comprehensive details

### Facebook Pixel Tracking
- Pixel ID: `1568883147881162` configured in `index.html`
- Complete event tracking via `src/utils/facebookPixel.ts`
- Events tracked: PageView, ViewContent, AddToCart, InitiateCheckout, AddPaymentInfo, Purchase, Share
- Purchase tracking for both Online UPI and COD flows
- Console logging for debugging (`📊 FB Pixel:` messages)
- See `FACEBOOK_PIXEL_GUIDE.md` for campaign setup and optimization

## Critical Files & Patterns

### Key Entry Points
- `src/App.tsx` - Main product page with checkout flow (991 lines)
- `src/components/ProductCatalog.tsx` - Product listing, admin routing, splash screen, URL detection
- `src/components/ProductDetail.tsx` - Product page with checkout, share button, SEO updates, FB Pixel events
- `src/utils/routing.ts` - URL routing helpers (slug generation, navigation, deep linking)
- `src/utils/seo.ts` - Dynamic SEO updates per product
- `src/utils/facebookPixel.ts` - Complete Facebook Pixel event tracking
- `server/index.mjs` - Express proxy for local dev
- `api/_utils.js` - Shared ZapUPI API helpers (credentials, request building)

### Order ID Generation
```typescript
// src/services/payment.ts
export const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `ORD${timestamp}${random}`;
};
```

### COD vs Online Payment Detection
```typescript
// App.tsx pattern
const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');

// Online payment flow
if (paymentMethod === 'online') {
  const response = await createPaymentOrder({ amount, orderId, customerMobile });
  // Show QR code, start polling
}

// COD flow
if (paymentMethod === 'cod') {
  await sendToGoogleSheets({ ...orderData, paymentMethod: 'COD' });
  await sendOrderConfirmationEmail({ ...orderData });
  // Show COD success screen
}
```

### Product Data Structure
```typescript
// src/hooks/useProducts.ts
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  description: string;
  features: string[];
}
```

## Common Pitfalls

1. **ZapUPI Credentials Exposure**: Never add credentials to frontend code or `.env.local` (use server-only `.env`)
2. **Admin API Not Running**: Product CRUD fails if `npm run admin-api` isn't running locally
3. **Vercel Production Products**: Can't edit via UI on Vercel - must manually update `public/products.json` and redeploy
4. **Payment Window Timers**: Cleanup `setInterval` in `useEffect` return to prevent memory leaks
5. **Google Sheets CORS**: Uses `mode: 'no-cors'` so response can't be read (success assumed)
6. **Typo in ZapUPI API**: Field is `custumer_mobile` (not `customer_mobile`) - don't "fix" this

## Environment Variables
```bash
# Server-side only (Express/Vercel functions)
ZAPUPI_API_KEY=your_key
ZAPUPI_SECRET_KEY=your_secret
PORT=4000                 # Express server port (optional)

# Client-side (optional)
VITE_API_BASE_URL=        # Override API endpoint (defaults to same origin)
```

## Documentation Map
- `PRODUCT_LINKS_GUIDE.md` - Direct product links implementation & usage
- `FACEBOOK_PIXEL_GUIDE.md` - Complete FB Pixel setup, events, and campaign optimization
- `ADMIN_GUIDE.md` - Admin dashboard usage & product management
- `COD_IMPLEMENTATION_GUIDE.md` - Cash on Delivery feature details
- `HOW_TO_ADD_PRODUCTS.md` - Manual product JSON editing
- `SEO_GUIDE.md`, `DEPLOYMENT_SUMMARY.md` - SEO strategy & implementation
- `GOOGLE_APPS_SCRIPT.js` - Complete Google Sheets backend code
- `README.md` - Quick start & deployment guide

## Testing Checklist
When modifying payment or order flows:
- [ ] Test both online UPI and COD paths
- [ ] Verify Google Sheets receives `paymentMethod` field
- [ ] Check payment window countdown/expiry behavior
- [ ] Test admin login and product CRUD locally
- [ ] Ensure no ZapUPI credentials leak to frontend bundles
- [ ] Validate customer form validation works identically for both payment methods
